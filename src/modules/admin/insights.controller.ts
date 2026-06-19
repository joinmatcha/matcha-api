import { NextFunction, Request, Response } from 'express';

import {
  InsightsDateRange,
  getInsightsActivity,
  getInsightsJobs,
  getInsightsOrientation,
  getInsightsOverview,
  getInsightsTests,
} from '@/services/analytics/insights';

function getRange(req: Request): InsightsDateRange {
  return {
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
}

export const getInsightsOverviewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getInsightsOverview(getRange(req)));
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
      .json({ activity: await getInsightsActivity(getRange(req)) });
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
    res.status(200).json({ tests: await getInsightsTests(getRange(req)) });
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
    res.status(200).json(await getInsightsJobs(getRange(req)));
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
    res.status(200).json(await getInsightsOrientation(getRange(req)));
  } catch (error) {
    next(error);
  }
};
