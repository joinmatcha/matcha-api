import { NextFunction, Request, Response } from 'express';

import { trackAnalyticsEvent } from '@/services/analytics/tracking';
import { HttpError } from '@/utils/httpError';

export const createAnalyticsEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Unauthorized');

    const event = await trackAnalyticsEvent(userId, req.body);

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};
