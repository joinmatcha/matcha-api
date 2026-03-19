import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import {
  DAILY_SWIPE_LIMIT,
  DISLIKE_COOLDOWN_DAYS,
  MAX_JOBS_PER_SECTOR,
} from '@/constants/swipe';
import { BilanCompetence } from '@/models/BilanCompetence';
import { Job } from '@/models/Job';
import { Swipe } from '@/models/Swipe';
import { SwipeQuota } from '@/models/SwipeQuota';
import { mapJobLabels } from '@/utils/jobLabelMapper';

function getDayKeyUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getUtcDayRange(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function getTodaySwipeConditions(dayKey: string) {
  const { start, end } = getUtcDayRange();
  return [{ dayKey }, { swipedAt: { $gte: start, $lt: end } }];
}

function getTodaySwipeFilter(userId: string, dayKey: string) {
  return {
    userId,
    $or: getTodaySwipeConditions(dayKey),
  };
}

type MongoDuplicateKeyError = Error & { code?: number };
type IdParams = { id: string };

const isDuplicateKeyError = (error: unknown): error is MongoDuplicateKeyError =>
  error instanceof Error &&
  typeof (error as MongoDuplicateKeyError).code === 'number' &&
  (error as MongoDuplicateKeyError).code === 11000;

async function reserveDailySwipeSlot(userId: string, dayKey: string) {
  try {
    const quota = await SwipeQuota.findOneAndUpdate(
      { userId, dayKey, count: { $lt: DAILY_SWIPE_LIMIT } },
      { $inc: { count: 1 }, $setOnInsert: { userId, dayKey } },
      { new: true, upsert: true }
    );

    return quota;
  } catch (error) {
    // Concurrent upsert can create a duplicate key race, retry once on existing doc.
    if (isDuplicateKeyError(error)) {
      return SwipeQuota.findOneAndUpdate(
        { userId, dayKey, count: { $lt: DAILY_SWIPE_LIMIT } },
        { $inc: { count: 1 } },
        { new: true }
      );
    }
    throw error;
  }
}

async function releaseDailySwipeSlot(userId: string, dayKey: string) {
  await SwipeQuota.updateOne(
    { userId, dayKey, count: { $gt: 0 } },
    { $inc: { count: -1 } }
  );
}

export const listJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sector =
      typeof req.query.sector === 'string' ? req.query.sector.trim() : '';
    const limitParam =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 100))
      : 20;

    const riasecRaw = req.query.riasec;
    const riasecList =
      typeof riasecRaw === 'string'
        ? riasecRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(riasecRaw)
          ? riasecRaw
              .flatMap((s) => (typeof s === 'string' ? s.split(',') : []))
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

    const filter: Record<string, unknown> = { isActive: true };

    if (q.length > 0) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }
    if (sector.length > 0) {
      filter.sector = sector;
    }
    if (riasecList.length > 0) {
      filter.riasec = { $in: riasecList };
    }

    const jobs = await Job.find(filter)
      .sort({ title: 1 })
      .limit(limit)
      .select('_id title sector description growthOutlook tags')
      .lean();

    return res.status(200).json({
      jobs: jobs.map((job) => ({
        id: job._id.toString(),
        title: job.title,
        sector: job.sector,
        description: job.description,
        growthOutlook: job.growthOutlook,
        tags: job.tags ?? [],
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getDeck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dayKey = getDayKeyUTC();

    const quota = await SwipeQuota.findOne({
      userId: req.user.id,
      dayKey,
    }).lean();
    const swipedTodayFromSwipes = await Swipe.countDocuments(
      getTodaySwipeFilter(req.user.id, dayKey)
    );
    const swipedToday = Math.max(quota?.count ?? 0, swipedTodayFromSwipes);

    const remaining = Math.max(DAILY_SWIPE_LIMIT - swipedToday, 0);

    if (remaining === 0) {
      return res.status(200).json({
        jobs: [],
        remaining: 0,
        limit: DAILY_SWIPE_LIMIT,
      });
    }

    const requested = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const size = Math.min(requested, remaining);

    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - DISLIKE_COOLDOWN_DAYS);

    const excludedSwipes = await Swipe.find({
      userId: req.user.id,
      $or: [
        ...getTodaySwipeConditions(dayKey),
        { action: 'dislike', swipedAt: { $gte: cooldownDate } },
      ],
    }).distinct('jobId');

    const jobs = await Job.aggregate([
      { $match: { isActive: true, _id: { $nin: excludedSwipes } } },
      { $group: { _id: '$sector', jobs: { $push: '$$ROOT' } } },
      { $project: { jobs: { $slice: ['$jobs', MAX_JOBS_PER_SECTOR] } } },
      { $unwind: '$jobs' },
      { $replaceRoot: { newRoot: '$jobs' } },
      { $sample: { size } },
      { $project: { _id: 1, title: 1, description: 1, sector: 1, tags: 1 } },
    ]);

    return res.status(200).json({
      jobs: jobs.map((j) => ({
        id: j._id.toString(),
        title: j.title,
        description: j.description,
        sector: j.sector,
        tags: j.tags ?? [],
      })),
      remaining,
      limit: DAILY_SWIPE_LIMIT,
    });
  } catch (error) {
    next(error);
  }
};

export const swipeJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { jobId, action } = req.body;
    const dayKey = getDayKeyUTC();

    if (!jobId || !action) {
      return res.status(400).json({ message: 'jobId et action sont requis' });
    }

    if (!['like', 'dislike'].includes(action)) {
      return res
        .status(400)
        .json({ message: 'action doit être "like" ou "dislike"' });
    }

    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'jobId invalide' });
    }

    const job = await Job.findOne({ _id: jobId, isActive: true });
    if (!job) {
      return res.status(404).json({ message: 'Job introuvable' });
    }

    const alreadySwiped = await Swipe.findOne({
      jobId,
      ...getTodaySwipeFilter(req.user.id, dayKey),
    })
      .select('_id')
      .lean();

    if (alreadySwiped) {
      return res
        .status(409)
        .json({ message: "Ce métier a déjà été swipé aujourd'hui" });
    }

    const swipedTodayFromSwipes = await Swipe.countDocuments(
      getTodaySwipeFilter(req.user.id, dayKey)
    );
    if (swipedTodayFromSwipes >= DAILY_SWIPE_LIMIT) {
      return res.status(429).json({
        message: 'Quota journalier atteint, reviens demain !',
        remaining: 0,
        limit: DAILY_SWIPE_LIMIT,
      });
    }

    const quota = await reserveDailySwipeSlot(req.user.id, dayKey);
    if (!quota) {
      return res.status(429).json({
        message: 'Quota journalier atteint, reviens demain !',
        remaining: 0,
        limit: DAILY_SWIPE_LIMIT,
      });
    }

    let swipe;
    try {
      swipe = await Swipe.create({
        userId: req.user.id,
        jobId,
        action,
        dayKey,
        swipedAt: new Date(),
      });
    } catch (error) {
      await releaseDailySwipeSlot(req.user.id, dayKey);
      if (isDuplicateKeyError(error)) {
        return res
          .status(409)
          .json({ message: "Ce métier a déjà été swipé aujourd'hui" });
      }
      throw error;
    }

    const usedAfterSwipe = swipedTodayFromSwipes + 1;
    const remaining = Math.max(DAILY_SWIPE_LIMIT - usedAfterSwipe, 0);

    return res.status(201).json({
      swipe: {
        id: swipe._id.toString(),
        jobId: swipe.jobId.toString(),
        action: swipe.action,
        swipedAt: swipe.swipedAt,
      },
      remaining,
      limit: DAILY_SWIPE_LIMIT,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecommendedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bilan = await BilanCompetence.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!bilan) {
      return res.status(404).json({ message: 'No bilan found' });
    }

    return res.status(200).json({
      jobs: bilan.conclusion.recommendedJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findOne({ _id: id, isActive: true }).lean();
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let recommendation;

    if (req.user) {
      const bilan = await BilanCompetence.findOne({
        user: req.user.id,
      })
        .sort({ createdAt: -1 })
        .lean();

      recommendation = bilan?.conclusion.recommendedJobs.find(
        (j) => j.id === id
      );
    }

    return res.status(200).json({
      job: {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        sector: job.sector,

        riasec: mapJobLabels.riasec(job.riasec),

        competences: mapJobLabels.competences(job.competences),
        softSkills: mapJobLabels.softSkills(job.softSkills),
        values: mapJobLabels.values(job.values),
        workConditions: mapJobLabels.workConditions(job.workConditions),

        missions: job.missions ?? [],
        dailyTasks: job.dailyTasks ?? [],
        evolutionPaths: job.evolutionPaths ?? [],

        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        growthOutlook: job.growthOutlook,
      },
      recommendation,
    });
  } catch (error) {
    next(error);
  }
};
