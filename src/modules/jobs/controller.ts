import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import {
  DAILY_SWIPE_LIMIT,
  DISLIKE_COOLDOWN_DAYS,
  MAX_JOBS_PER_SECTOR,
} from '@/constants/swipe';
import { MatchingDecision } from '@/models/MatchingDecision';
import { RecommendationProfile } from '@/models/RecommendationProfile';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
import { Swipe } from '@/models/Swipe';
import { SwipeQuota } from '@/models/SwipeQuota';
import { compareJobsForUser } from '@/services/jobs/compare';
import {
  buildProfileMatching,
  getPersonalizedDeckJobs,
  refreshRecommendationProfile,
} from '@/services/jobs/profileMatching';
import { getTopLikedJobsForUser } from '@/services/jobs/topLiked';
import {
  computeWorkStyleCompatibility,
  getLatestWorkStyleResult,
} from '@/services/workStyle/compute';
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

function formatMatchedJobSummary(job: {
  id: string;
  code: string;
  title: string;
  sector?: string;
  description?: string;
}) {
  return {
    id: job.id,
    code: job.code,
    title: job.title,
    sector: job.sector,
    description: job.description,
    growthOutlook: 'unknown',
    tags: [],
    riasec: [],
  };
}

function toObjectIdString(value: unknown) {
  return value instanceof Types.ObjectId ? value.toString() : String(value);
}

function formatMatchingProfileJob(
  job: {
    jobId: Types.ObjectId;
    code: string;
    title: string;
    sector?: string;
    score: number;
    reasons: string[];
  },
  action?: 'like' | 'dislike'
) {
  return {
    id: toObjectIdString(job.jobId),
    code: job.code,
    title: job.title,
    sector: job.sector,
    score: job.score,
    reasons: job.reasons,
    decision: action ?? null,
  };
}

async function getFreshRecommendationProfile(userId: string) {
  const profile = await RecommendationProfile.findOne({ user: userId }).lean();
  if (profile) return profile;

  return refreshRecommendationProfile(userId);
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
        { action: 'like' },
        { action: 'dislike', swipedAt: { $gte: cooldownDate } },
      ],
    }).distinct('jobId');

    const personalizedJobs = await getPersonalizedDeckJobs({
      userId: req.user.id,
      excludedJobIds: excludedSwipes,
      limit: size,
    });

    const personalizedIds = personalizedJobs.map(
      (job) => new Types.ObjectId(job.id)
    );
    const fallbackSize = Math.max(size - personalizedJobs.length, 0);
    const fallbackJobs =
      fallbackSize > 0
        ? await RomeMetier.aggregate([
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
          ])
        : [];

    const fallbackWithoutDuplicates = fallbackJobs.filter(
      (job) =>
        !personalizedIds.some((id) => id.equals(job._id as Types.ObjectId))
    );

    return res.status(200).json({
      jobs: [
        ...personalizedJobs.map(formatMatchedJobSummary),
        ...fallbackWithoutDuplicates.map(formatRomeJobSummary),
      ].slice(0, size),
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
    await refreshRecommendationProfile(req.user.id);

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

    const matching = await buildProfileMatching(req.user.id, {
      limit: 20,
      minScore: 15,
    });

    if (!matching.unlocked) {
      return res.status(200).json({
        unlocked: false,
        missingTests: matching.missingTests,
        sectors: matching.sectors,
        jobs: [],
      });
    }

    return res.status(200).json({
      unlocked: true,
      sectors: matching.sectors,
      jobs: matching.jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobMatching = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await getFreshRecommendationProfile(req.user.id);
    if (!profile?.unlocked) {
      return res.status(200).json({
        unlocked: false,
        missingTests: profile?.missingSources ?? [
          'bilan',
          'personality',
          'work_style',
        ],
        sectors: profile?.sectors ?? [],
        total: 0,
        remaining: 0,
        completed: false,
        jobs: [],
        likedJobs: [],
        dislikedJobs: [],
      });
    }

    const jobIds = profile.matchedJobs.map((job) => job.jobId);
    const decisions = await MatchingDecision.find({
      userId: req.user.id,
      jobId: { $in: jobIds },
    }).lean();
    const decisionsByJobId = new Map(
      decisions.map((decision) => [decision.jobId.toString(), decision.action])
    );

    const jobs = profile.matchedJobs.map((job) =>
      formatMatchingProfileJob(job, decisionsByJobId.get(job.jobId.toString()))
    );
    const likedJobs = jobs.filter((job) => job.decision === 'like');
    const dislikedJobs = jobs.filter((job) => job.decision === 'dislike');
    const remaining = jobs.filter((job) => !job.decision).length;

    return res.status(200).json({
      unlocked: true,
      missingTests: [],
      sectors: profile.sectors,
      total: jobs.length,
      remaining,
      completed: jobs.length > 0 && remaining === 0,
      jobs,
      likedJobs,
      dislikedJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const decideJobMatching = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { jobId, action } = req.body as {
      jobId: string;
      action: 'like' | 'dislike';
    };

    const profile = await getFreshRecommendationProfile(req.user.id);
    const isMatchedJob = profile?.matchedJobs.some((job) =>
      job.jobId.equals(jobId)
    );

    if (!profile?.unlocked || !isMatchedJob) {
      return res
        .status(404)
        .json({ message: 'Métier absent du matching actuel' });
    }

    await MatchingDecision.findOneAndUpdate(
      { userId: req.user.id, jobId },
      { $set: { action, decidedAt: new Date() } },
      { upsert: true, new: true }
    );

    return getJobMatching(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const resetJobMatching = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await getFreshRecommendationProfile(req.user.id);
    const jobIds = profile?.matchedJobs.map((job) => job.jobId) ?? [];

    await MatchingDecision.deleteMany({
      userId: req.user.id,
      ...(jobIds.length ? { jobId: { $in: jobIds } } : {}),
    });

    return getJobMatching(req, res, next);
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

    const jobs = await getTopLikedJobsForUser(req.user.id, limit);

    return res.status(200).json({
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

export const compareJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await compareJobsForUser(req.user.id, req.body.jobIds);

    return res.status(200).json(result);
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
    let workStyleCompatibility = null;

    if (req.user) {
      const [recommendationProfile, workStyle] = await Promise.all([
        RecommendationProfile.findOne({
          user: req.user.id,
        }).lean(),
        getLatestWorkStyleResult(req.user.id),
      ]);

      const matchedJob = recommendationProfile?.matchedJobs.find((matched) =>
        matched.jobId.equals(job._id)
      );
      recommendation = matchedJob
        ? {
            score: matchedJob.score,
            reasons: matchedJob.reasons,
          }
        : undefined;
      workStyleCompatibility = computeWorkStyleCompatibility(workStyle, job);
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
        workStyleCompatibility,
        lastSyncedAt: job.lastSyncedAt,
      },
      recommendation,
    });
  } catch (error) {
    next(error);
  }
};
