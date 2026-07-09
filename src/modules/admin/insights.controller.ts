import { NextFunction, Request, Response } from 'express';

import User from '@/models/User';
import {
  InsightsDateRange,
  getInsightsActivity,
  getInsightsJobs,
  getInsightsOrientation,
  getInsightsOverview,
  getInsightsTests,
} from '@/services/analytics/insights';
import { hashAnalyticsUserId } from '@/services/analytics/tracking';

async function getRange(req: Request): Promise<InsightsDateRange> {
  const range: InsightsDateRange = {
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };

  const userEmail = req.query.userEmail
    ? String(req.query.userEmail).trim().toLowerCase()
    : '';

  if (!userEmail) return range;

  const user = await User.findOne({ email: userEmail }).select('_id').lean();
  if (!user?._id) {
    return { ...range, userHash: '__no_matching_user__' };
  }

  return {
    ...range,
    userHash: hashAnalyticsUserId(user._id.toString()),
    userId: user._id,
  };
}

export const getInsightsOverviewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getInsightsOverview(await getRange(req)));
  } catch (error) {
    next(error);
  }
};

export const getInsightsActivityAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res
      .status(200)
      .json({ activity: await getInsightsActivity(await getRange(req)) });
  } catch (error) {
    next(error);
  }
};

export const getInsightsTestsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res
      .status(200)
      .json({ tests: await getInsightsTests(await getRange(req)) });
  } catch (error) {
    next(error);
  }
};

export const getInsightsJobsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getInsightsJobs(await getRange(req)));
  } catch (error) {
    next(error);
  }
};

export const getInsightsOrientationAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getInsightsOrientation(await getRange(req)));
  } catch (error) {
    next(error);
  }
};
