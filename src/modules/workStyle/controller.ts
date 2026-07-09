import { NextFunction, Request, Response } from 'express';

import {
  computeWorkStyle,
  getActiveWorkStyleVersion,
  getLatestWorkStyleResult,
  getWorkStyleHistory,
  resetUserWorkStyle,
} from '@/services/workStyle/compute';
import { HttpError } from '@/utils/httpError';

export const getActiveWorkStyle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Unauthorized');

    const latestResult = await getLatestWorkStyleResult(userId);
    const test = await getActiveWorkStyleVersion();

    if (!test) {
      return res.status(404).json({ message: 'Aucun test actif trouvé' });
    }

    return res.status(200).json({
      completed: Boolean(latestResult),
      latestResult,
      test,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyWorkStyle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Unauthorized');

    const [latestResult, history] = await Promise.all([
      getLatestWorkStyleResult(userId),
      getWorkStyleHistory(userId),
    ]);

    return res.status(200).json({ latestResult, history });
  } catch (error) {
    next(error);
  }
};

export const submitWorkStyle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Unauthorized');

    const result = await computeWorkStyle(userId, req.body.answers);

    return res.status(201).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const resetWorkStyle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Unauthorized');

    await resetUserWorkStyle(userId);

    return res.status(200).json({ message: 'Work style test reset' });
  } catch (error) {
    next(error);
  }
};
