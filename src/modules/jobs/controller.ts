import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import {
  DAILY_SWIPE_LIMIT,
  DISLIKE_COOLDOWN_DAYS,
  MAX_JOBS_PER_SECTOR,
} from '@/constants/swipe';
import { BilanCompetence } from '@/models/BilanCompetence';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
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

function formatRomeJobSummary(job: any) {
  return {
    id: job._id.toString(),
    code: job.code,
    title: job.label,
    sector: job.domain?.label ?? job.domain?.grandDomain?.label,
    description: job.definition,
    growthOutlook: 'unknown',
    tags: [
      ...(job.themes ?? []).map((theme: { label?: string }) => theme.label),
      ...(job.sectors ?? []).map((sector: { label?: string }) => sector.label),
    ].filter(Boolean),
    riasec: job.riasec?.codes ?? [],
  };
}

function formatMarketStats(market: any) {
  if (!market) return null;

  return {
    territory: market.territory,
    salary: market.salary,
    offers: market.offers,
    hires: market.hires,
    demanders: market.demanders,
    tension: market.tension,
    lastSyncedAt: market.lastSyncedAt,
  };
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
    const andFilters: Record<string, unknown>[] = [];

    if (q.length > 0) {
      andFilters.push({
        $or: [
          { label: { $regex: q, $options: 'i' } },
          { definition: { $regex: q, $options: 'i' } },
          { 'appellations.label': { $regex: q, $options: 'i' } },
        ],
      });
    }
    if (sector.length > 0) {
      andFilters.push({
        $or: [
          { 'domain.label': sector },
          { 'domain.grandDomain.label': sector },
          { 'sectors.label': sector },
        ],
      });
    }
    if (riasecList.length > 0) {
      filter['riasec.codes'] = { $in: riasecList };
    }
    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    const jobs = await RomeMetier.find(filter)
      .sort({ label: 1 })
      .limit(limit)
      .select(
        '_id code label definition domain riasec themes sectors transitions'
      )
      .lean();

    return res.status(200).json({
      jobs: jobs.map(formatRomeJobSummary),
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

    const jobs = await RomeMetier.aggregate([
      { $match: { isActive: true, _id: { $nin: excludedSwipes } } },
      {
        $group: {
          _id: '$domain.label',
          jobs: { $push: '$$ROOT' },
        },
      },
      { $project: { jobs: { $slice: ['$jobs', MAX_JOBS_PER_SECTOR] } } },
      { $unwind: '$jobs' },
      { $replaceRoot: { newRoot: '$jobs' } },
      { $sample: { size } },
      {
        $project: {
          _id: 1,
          code: 1,
          label: 1,
          definition: 1,
          domain: 1,
          themes: 1,
          sectors: 1,
        },
      },
    ]);

    return res.status(200).json({
      jobs: jobs.map(formatRomeJobSummary),
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

    const job = await RomeMetier.findOne({
      _id: jobId,
      isActive: true,
    }).select('_id');
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

export const getTopLikedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const limitParam =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : 3;
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 10))
      : 3;

    const jobs = await Swipe.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.user.id),
          action: 'like',
        },
      },
      {
        $group: {
          _id: '$jobId',
          likesCount: { $sum: 1 },
          lastLikedAt: { $max: '$swipedAt' },
        },
      },
      { $sort: { likesCount: -1, lastLikedAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'romemetiers',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      { $match: { 'job.isActive': true } },
      {
        $project: {
          _id: '$job._id',
          code: '$job.code',
          label: '$job.label',
          definition: '$job.definition',
          domain: '$job.domain',
          themes: '$job.themes',
          sectors: '$job.sectors',
          riasec: '$job.riasec',
          likesCount: 1,
          lastLikedAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      jobs: jobs.map((job) => ({
        ...formatRomeJobSummary(job),
        likesCount: job.likesCount,
        lastLikedAt: job.lastLikedAt,
      })),
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

    const job = await RomeMetier.findOne({ _id: id, isActive: true }).lean();

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const market = await RomeMarketStat.findOne({ metierId: job._id })
      .sort({ lastSyncedAt: -1 })
      .select('-raw -__v')
      .lean();

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
        ...formatRomeJobSummary(job),
        definition: job.definition,
        accessToJob: job.accessToJob,
        domain: job.domain,
        riasec: mapJobLabels.riasec(job.riasec.codes),
        appellations: job.appellations,
        skills: job.skills,
        skillGroups: job.skillGroups,
        knowledge: job.knowledge,
        knowledgeGroups: job.knowledgeGroups,
        workContexts: job.workContexts,
        themes: job.themes,
        interests: job.interests,
        trainingCodes: job.trainingCodes,
        sectors: job.sectors,
        relatedJobs: job.relatedJobs,
        transitions: job.transitions,
        isExecutive: job.isExecutive,
        isRegulated: job.isRegulated,
        market: formatMarketStats(market),
        lastSyncedAt: job.lastSyncedAt,
      },
      recommendation,
    });
  } catch (error) {
    next(error);
  }
};
