import { NextFunction, Request, Response } from 'express';

import { RomeAppellation } from '@/models/RomeAppellation';
import { RomeMetier } from '@/models/RomeMetier';
import { RomeSyncRun } from '@/models/RomeSyncRun';
import { RomeSyncService } from '@/services/rome/sync';

export const startRomeSyncAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const existing = await RomeSyncRun.findOne({
      status: { $in: ['queued', 'running'] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existing) {
      return res.status(409).json({
        message: 'Un import ROME est déjà en cours',
        syncRunId: existing._id.toString(),
        status: existing.status,
      });
    }

    const result = await RomeSyncService.startSync({
      type: 'manual',
      startedBy: req.user?.id,
    });

    return res.status(202).json({
      syncRunId: result.runId,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
};

export const listRomeSyncRunsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [runs, total] = await Promise.all([
      RomeSyncRun.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RomeSyncRun.countDocuments(),
    ]);

    return res.status(200).json({
      runs: runs.map((run) => ({
        ...run,
        id: run._id.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRomeSyncRunAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const run = await RomeSyncRun.findById(req.params.id).lean();

    if (!run) {
      return res.status(404).json({ message: 'Import ROME introuvable' });
    }

    return res.status(200).json({
      run: {
        ...run,
        id: run._id.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRomeStatusAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      currentRun,
      lastSuccessfulRun,
      lastRun,
      activeMetiers,
      activeAppellations,
    ] = await Promise.all([
      RomeSyncRun.findOne({ status: { $in: ['queued', 'running'] } })
        .sort({ createdAt: -1 })
        .lean(),
      RomeSyncRun.findOne({ status: 'success' })
        .sort({ finishedAt: -1 })
        .lean(),
      RomeSyncRun.findOne().sort({ createdAt: -1 }).lean(),
      RomeMetier.countDocuments({ isActive: true }),
      RomeAppellation.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      isRunning: Boolean(currentRun),
      currentRun: currentRun
        ? {
            id: currentRun._id.toString(),
            status: currentRun.status,
            currentStep: currentRun.currentStep,
            currentCode: currentRun.currentCode,
            progress: {
              totalAppellations: currentRun.totalAppellations,
              uniqueMetiers: currentRun.uniqueMetiers,
              fetchedMetiers: currentRun.fetchedMetiers,
              fetchedFiches: currentRun.fetchedFiches,
            },
          }
        : null,
      lastSuccessfulRun: lastSuccessfulRun
        ? {
            id: lastSuccessfulRun._id.toString(),
            finishedAt: lastSuccessfulRun.finishedAt,
            upsertedMetiers: lastSuccessfulRun.upsertedMetiers,
            updatedMetiers: lastSuccessfulRun.updatedMetiers,
            deactivatedMetiers: lastSuccessfulRun.deactivatedMetiers,
          }
        : null,
      lastRun: lastRun
        ? {
            id: lastRun._id.toString(),
            status: lastRun.status,
            createdAt: lastRun.createdAt,
            finishedAt: lastRun.finishedAt,
          }
        : null,
      totals: {
        activeMetiers,
        activeAppellations,
      },
    });
  } catch (error) {
    next(error);
  }
};
