import { env } from '@/config/env';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
import {
  MarketStatsApiError,
  MarketStatsClient,
} from '@/services/market/client';
import { mapMarketIndicator } from '@/services/market/mapper';

type MarketSyncStep = 'fetch_market_stats' | 'write_db' | 'done';

export interface MarketSyncProgress {
  step: MarketSyncStep;
  at: Date;
  startedAt: Date;
  total: number;
  fetched: number;
  updated: number;
  errors: number;
  currentCode?: string;
}

interface MarketSyncOptions {
  limit?: number;
  onProgress?: (progress: MarketSyncProgress) => void;
}

interface MarketSyncError {
  code: string;
  message: string;
  status?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithDelay<T>(callback: () => Promise<T>) {
  const result = await callback();
  await sleep(env.MARKET_STATS_REQUEST_DELAY_MS);
  return result;
}

function isNotFound(error: unknown) {
  return error instanceof MarketStatsApiError && error.status === 404;
}

export class MarketStatsSyncService {
  static async runSync(options: MarketSyncOptions = {}) {
    const startedAt = new Date();
    const client = new MarketStatsClient();
    const limit = options.limit ?? env.MARKET_STATS_SYNC_LIMIT;
    const statsErrors: MarketSyncError[] = [];
    let fetched = 0;
    let updated = 0;

    const total = limit
      ? Math.min(await RomeMetier.countDocuments({ isActive: true }), limit)
      : await RomeMetier.countDocuments({ isActive: true });
    const metierCursor = RomeMetier.find({ isActive: true })
      .sort({ code: 1 })
      .limit(limit ?? 0)
      .select('_id code label')
      .lean()
      .cursor();

    const report = (step: MarketSyncStep, currentCode?: string) => {
      options.onProgress?.({
        step,
        at: new Date(),
        startedAt,
        total,
        fetched,
        updated,
        errors: statsErrors.length,
        currentCode,
      });
    };

    report('fetch_market_stats');

    for await (const metier of metierCursor) {
      try {
        const salary = await callWithDelay(() =>
          client.getSalaryByRome(metier.code).catch((error) => {
            if (isNotFound(error)) return undefined;
            throw error;
          })
        );
        const offers = await callWithDelay(() =>
          client.getOffers(metier.code).catch((error) => {
            if (isNotFound(error)) return undefined;
            throw error;
          })
        );
        const hires = await callWithDelay(() =>
          client.getHires(metier.code).catch((error) => {
            if (isNotFound(error)) return undefined;
            throw error;
          })
        );
        const demanders = await callWithDelay(() =>
          client.getDemanders(metier.code).catch((error) => {
            if (isNotFound(error)) return undefined;
            throw error;
          })
        );
        const tension = await callWithDelay(() =>
          client.getTension(metier.code).catch((error) => {
            if (isNotFound(error)) return undefined;
            throw error;
          })
        );

        report('write_db', metier.code);

        const now = new Date();
        await RomeMarketStat.updateOne(
          {
            metierCode: metier.code,
            'territory.type': env.MARKET_STATS_TERRITORY_TYPE,
            'territory.code': env.MARKET_STATS_TERRITORY_CODE,
          },
          {
            $set: {
              metierId: metier._id,
              metierCode: metier.code,
              metierLabel: metier.label,
              territory: {
                type: env.MARKET_STATS_TERRITORY_TYPE,
                code: env.MARKET_STATS_TERRITORY_CODE,
                label:
                  salary?.libTerritoire ??
                  offers?.libTerritoire ??
                  hires?.libTerritoire ??
                  demanders?.libTerritoire ??
                  tension?.libTerritoire,
              },
              salary: mapMarketIndicator(salary),
              offers: mapMarketIndicator(offers),
              hires: mapMarketIndicator(hires),
              demanders: mapMarketIndicator(demanders),
              tension: mapMarketIndicator(tension),
              lastSyncedAt: now,
              raw: {
                salary,
                offers,
                hires,
                demanders,
                tension,
              },
            },
          },
          { upsert: true }
        );

        fetched += 1;
        updated += 1;
        report('fetch_market_stats', metier.code);
      } catch (error) {
        statsErrors.push({
          code: metier.code,
          message: error instanceof Error ? error.message : String(error),
          status:
            error instanceof MarketStatsApiError ? error.status : undefined,
        });
      }
    }

    report('done');

    return {
      status: statsErrors.length > 0 ? 'partial_failure' : 'success',
      total,
      fetched,
      updated,
      errors: statsErrors,
    };
  }
}
