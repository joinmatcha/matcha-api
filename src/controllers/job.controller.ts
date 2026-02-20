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
import { mapJobLabels } from '@/utils/jobLabelMapper';

function getStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const getDeck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const swipedToday = await Swipe.countDocuments({
      userId: req.user.id,
      swipedAt: { $gte: getStartOfDay() },
    });

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
        { swipedAt: { $gte: getStartOfDay() } },
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
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { jobId, action } = req.body;

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

    const startOfDay = getStartOfDay();

    const swipedToday = await Swipe.countDocuments({
      userId: req.user.id,
      swipedAt: { $gte: startOfDay },
    });

    if (swipedToday >= DAILY_SWIPE_LIMIT) {
      return res.status(429).json({
        message: 'Quota journalier atteint, reviens demain !',
        remaining: 0,
        limit: DAILY_SWIPE_LIMIT,
      });
    }

    const alreadySwiped = await Swipe.findOne({
      userId: req.user.id,
      jobId,
      swipedAt: { $gte: startOfDay },
    });

    if (alreadySwiped) {
      return res
        .status(409)
        .json({ message: "Ce métier a déjà été swipé aujourd'hui" });
    }

    const swipe = await Swipe.create({
      userId: req.user.id,
      jobId,
      action,
      swipedAt: new Date(),
    });

    const remaining = DAILY_SWIPE_LIMIT - swipedToday - 1;

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
  next: NextFunction,
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
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findOne({ _id: id, isActive: true });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let recommendation;

    if (req.user) {
      const bilan = await BilanCompetence.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      recommendation = bilan?.conclusion.recommendedJobs.find(
        (j) => j.id === id,
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
