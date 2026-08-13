import { AnyBulkWriteOperation, Types } from 'mongoose';

import { env } from '@/config/env';
import { RomeAppellation } from '@/models/RomeAppellation';
import { RomeMetier, RomeMetierDocument } from '@/models/RomeMetier';
import {
  RomeSyncRun,
  RomeSyncRunDocument,
  RomeSyncStep,
} from '@/models/RomeSyncRun';
import { RomeApiError, RomeClient } from '@/services/rome/client';
import {
  buildRomeAppellationUpdate,
  buildRomeMetierUpdate,
} from '@/services/rome/mapper';
import { RomeAppellationApi, RomeMetierApi } from '@/services/rome/types';
import { sleep } from '@/services/rome/utils';

type SyncType = 'manual' | 'scheduled' | 'script';

interface StartSyncOptions {
  type: SyncType;
  startedBy?: string;
  runInBackground?: boolean;
  onProgress?: (progress: RomeSyncProgress) => void;
}

interface RunSyncOptions {
  type: SyncType;
  startedBy?: string;
  onProgress?: (progress: RomeSyncProgress) => void;
}

interface SyncResult {
  runId: string;
  status: RomeSyncRunDocument['status'];
}

export interface RomeSyncProgress {
  step:
    | 'list_appellations'
    | 'fetch_metiers'
    | 'write_db'
    | 'deactivate_missing'
    | 'done';
  currentCode?: string;
  totalAppellations?: number;
  uniqueMetiers?: number;
  fetchedMetiers?: number;
  fetchedFiches?: number;
  errors?: number;
  startedAt: Date;
  at: Date;
}

type RomeAppellationUpdate = NonNullable<
  ReturnType<typeof buildRomeAppellationUpdate>
>;

const bulkWriteBatchSize = 100;

let inProcessSync: Promise<void> | undefined;

function groupAppellationsByMetier(appellations: RomeAppellationApi[]) {
  const grouped = new Map<string, RomeAppellationApi[]>();

  for (const appellation of appellations) {
    const code = appellation.metier?.code;
    if (!code) continue;

    const group = grouped.get(code) ?? [];
    group.push(appellation);
    grouped.set(code, group);
  }

  return grouped;
}

async function updateRun(
  runId: Types.ObjectId,
  update: Partial<RomeSyncRunDocument>
) {
  await RomeSyncRun.findByIdAndUpdate(runId, { $set: update });
}

async function addRunError(
  runId: Types.ObjectId,
  error: {
    code?: string;
    step: RomeSyncStep | 'fetch_metier' | 'fetch_fiche' | 'oauth';
    message: string;
    retryable?: boolean;
  }
) {
  await RomeSyncRun.findByIdAndUpdate(runId, {
    $push: {
      errors: {
        ...error,
        at: new Date(),
      },
    },
  });
}

function bulkWriteCounts(result: {
  upsertedCount?: number;
  modifiedCount?: number;
}) {
  return {
    upserted: result.upsertedCount ?? 0,
    modified: result.modifiedCount ?? 0,
  };
}

async function flushMetierOperations(
  operations: AnyBulkWriteOperation<RomeMetierDocument>[]
) {
  if (operations.length === 0) {
    return { upserted: 0, modified: 0 };
  }

  const result = await RomeMetier.bulkWrite(operations, { ordered: false });
  operations.length = 0;
  return bulkWriteCounts(result);
}

async function flushAppellationOperations(
  operations: AnyBulkWriteOperation<RomeAppellationUpdate>[]
) {
  if (operations.length === 0) {
    return { upserted: 0, modified: 0 };
  }

  const result = await RomeAppellation.bulkWrite(operations, { ordered: false });
  operations.length = 0;
  return bulkWriteCounts(result);
}

async function deactivateMissing(
  seenMetierCodes: string[],
  seenAppellationCodes: string[],
  now: Date
) {
  const [metiers, appellations] = await Promise.all([
    RomeMetier.updateMany(
      { code: { $nin: seenMetierCodes }, isActive: true },
      { $set: { isActive: false, removedFromRomeAt: now } }
    ),
    RomeAppellation.updateMany(
      { code: { $nin: seenAppellationCodes }, isActive: true },
      { $set: { isActive: false, removedFromRomeAt: now } }
    ),
  ]);

  return {
    deactivatedMetiers: metiers.modifiedCount,
    deactivatedAppellations: appellations.modifiedCount,
  };
}

export class RomeSyncService {
  static async startSync(options: StartSyncOptions): Promise<SyncResult> {
    const existing = await RomeSyncRun.findOne({
      status: { $in: ['queued', 'running'] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existing || inProcessSync) {
      return {
        runId: existing?._id.toString() ?? 'in-process',
        status: 'running',
      };
    }

    const run = await RomeSyncRun.create({
      type: options.type,
      status: 'queued',
      currentStep: 'queued',
      startedBy: options.startedBy,
    });

    const execute = async () => {
      await RomeSyncService.executeRun(run._id, options.onProgress);
    };

    if (options.runInBackground === false) {
      await execute();
    } else {
      inProcessSync = execute().finally(() => {
        inProcessSync = undefined;
      });
    }

    return {
      runId: run._id.toString(),
      status: 'queued',
    };
  }

  static async runSync(options: RunSyncOptions): Promise<SyncResult> {
    return RomeSyncService.startSync({
      ...options,
      runInBackground: false,
    });
  }

  static async executeRun(
    runId: Types.ObjectId,
    onProgress?: (progress: RomeSyncProgress) => void
  ): Promise<void> {
    const client = new RomeClient();
    const now = new Date();
    const metierOperations: AnyBulkWriteOperation<RomeMetierDocument>[] = [];
    let upsertedMetiers = 0;
    let updatedMetiers = 0;

    try {
      await updateRun(runId, {
        status: 'running',
        currentStep: 'auth',
        startedAt: now,
      });

      await updateRun(runId, { currentStep: 'list_appellations' });
      onProgress?.({
        step: 'list_appellations',
        startedAt: now,
        at: new Date(),
      });
      const appellations = await client.listAppellations();
      const grouped = groupAppellationsByMetier(appellations);
      const metierCodes = Array.from(grouped.keys()).sort();
      const seenAppellationCodes = appellations
        .map((appellation) => appellation.code)
        .filter(Boolean);

      await updateRun(runId, {
        totalAppellations: appellations.length,
        uniqueMetiers: metierCodes.length,
        currentStep: 'fetch_metiers',
      });
      onProgress?.({
        step: 'fetch_metiers',
        totalAppellations: appellations.length,
        uniqueMetiers: metierCodes.length,
        fetchedMetiers: 0,
        fetchedFiches: 0,
        errors: 0,
        startedAt: now,
        at: new Date(),
      });

      let fetchedMetiers = 0;
      let fetchedFiches = 0;
      let errors = 0;

      for (const [index, code] of metierCodes.entries()) {
        await updateRun(runId, {
          currentStep: 'fetch_metiers',
          currentCode: code,
        });
        onProgress?.({
          step: 'fetch_metiers',
          currentCode: code,
          totalAppellations: appellations.length,
          uniqueMetiers: metierCodes.length,
          fetchedMetiers,
          fetchedFiches,
          errors,
          startedAt: now,
          at: new Date(),
        });

        let metier: RomeMetierApi;

        try {
          await sleep(env.ROME_REQUEST_DELAY_MS);
          metier = await client.getMetier(code);
          fetchedMetiers += 1;
          await RomeSyncRun.findByIdAndUpdate(runId, {
            $inc: { fetchedMetiers: 1 },
          });
        } catch (error) {
          await addRunError(runId, {
            code,
            step: 'fetch_metier',
            message: error instanceof Error ? error.message : String(error),
            retryable:
              error instanceof RomeApiError ? error.retryable : undefined,
          });
          errors += 1;
          continue;
        }

        let ficheMetier;
        try {
          await updateRun(runId, {
            currentStep: 'fetch_fiches',
            currentCode: code,
          });
          await sleep(env.ROME_REQUEST_DELAY_MS);
          ficheMetier = await client.getFicheMetier(code);
          if (ficheMetier) {
            fetchedFiches += 1;
            await RomeSyncRun.findByIdAndUpdate(runId, {
              $inc: { fetchedFiches: 1 },
            });
          }
        } catch (error) {
          await addRunError(runId, {
            code,
            step: 'fetch_fiche',
            message: error instanceof Error ? error.message : String(error),
            retryable:
              error instanceof RomeApiError ? error.retryable : undefined,
          });
          errors += 1;
        }

        const update = buildRomeMetierUpdate(
          metier,
          ficheMetier,
          grouped.get(code) ?? [],
          now
        );

        metierOperations.push({
          updateOne: {
            filter: { code },
            update: { $set: update },
            upsert: true,
          },
        });

        if (metierOperations.length >= bulkWriteBatchSize) {
          const counts = await flushMetierOperations(metierOperations);
          upsertedMetiers += counts.upserted;
          updatedMetiers += counts.modified;
          await updateRun(runId, {
            upsertedMetiers,
            updatedMetiers,
          });
        }

        if ((index + 1) % 25 === 0 || index + 1 === metierCodes.length) {
          onProgress?.({
            step: 'fetch_metiers',
            currentCode: code,
            totalAppellations: appellations.length,
            uniqueMetiers: metierCodes.length,
            fetchedMetiers,
            fetchedFiches,
            errors,
            startedAt: now,
            at: new Date(),
          });
        }
      }

      await updateRun(runId, {
        currentStep: 'write_db',
        currentCode: undefined,
      });
      onProgress?.({
        step: 'write_db',
        totalAppellations: appellations.length,
        uniqueMetiers: metierCodes.length,
        fetchedMetiers,
        fetchedFiches,
        errors,
        startedAt: now,
        at: new Date(),
      });

      if (metierOperations.length > 0) {
        const counts = await flushMetierOperations(metierOperations);
        upsertedMetiers += counts.upserted;
        updatedMetiers += counts.modified;
        await updateRun(runId, {
          upsertedMetiers,
          updatedMetiers,
        });
      }

      const metiers = await RomeMetier.find({
        code: { $in: metierCodes },
      }).select('_id code');
      const metierIdByCode = new Map(
        metiers.map((metier) => [metier.code, metier._id])
      );

      const appellationOperations: AnyBulkWriteOperation<RomeAppellationUpdate>[] =
        [];
      let upsertedAppellations = 0;
      let updatedAppellations = 0;

      for (const appellationApi of appellations) {
        const appellation = buildRomeAppellationUpdate(
          appellationApi,
          metierIdByCode,
          now
        );

        if (!appellation) continue;

        appellationOperations.push({
          updateOne: {
            filter: { code: appellation.code },
            update: { $set: appellation },
            upsert: true,
          },
        });

        if (appellationOperations.length >= bulkWriteBatchSize) {
          const counts = await flushAppellationOperations(
            appellationOperations
          );
          upsertedAppellations += counts.upserted;
          updatedAppellations += counts.modified;
          await updateRun(runId, {
            upsertedAppellations,
            updatedAppellations,
          });
        }
      }

      if (appellationOperations.length > 0) {
        const counts = await flushAppellationOperations(appellationOperations);
        upsertedAppellations += counts.upserted;
        updatedAppellations += counts.modified;
      }

      await updateRun(runId, {
        upsertedAppellations,
        updatedAppellations,
      });

      await updateRun(runId, { currentStep: 'deactivate_missing' });
      onProgress?.({
        step: 'deactivate_missing',
        totalAppellations: appellations.length,
        uniqueMetiers: metierCodes.length,
        fetchedMetiers,
        fetchedFiches,
        errors,
        startedAt: now,
        at: new Date(),
      });
      const deactivated = await deactivateMissing(
        metierCodes,
        seenAppellationCodes,
        now
      );

      const finalRun = await RomeSyncRun.findById(runId).lean();
      const hasErrors = (finalRun?.errors.length ?? 0) > 0;

      await updateRun(runId, {
        ...deactivated,
        status: hasErrors ? 'partial_failure' : 'success',
        currentStep: 'done',
        currentCode: undefined,
        finishedAt: new Date(),
      });
      onProgress?.({
        step: 'done',
        totalAppellations: appellations.length,
        uniqueMetiers: metierCodes.length,
        fetchedMetiers,
        fetchedFiches,
        errors,
        startedAt: now,
        at: new Date(),
      });
    } catch (error) {
      await addRunError(runId, {
        step: 'oauth',
        message: error instanceof Error ? error.message : String(error),
        retryable: error instanceof RomeApiError ? error.retryable : undefined,
      });
      await updateRun(runId, {
        status: 'failed',
        finishedAt: new Date(),
      });
    }
  }
}
