import { NextFunction, Request, Response } from 'express';

import {
  getUserPersonalityStatus,
  resetUserPersonalityTest,
  submitUserPersonalityTest,
} from '@/services/personality/test';
import { HttpError } from '@/utils/httpError';

export const getActiveTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  if (!userId) return next(new HttpError(401, 'Unauthorized'));

  try {
    const status = await getUserPersonalityStatus(userId);
    if (status.completed) {
      return res.json({
        completed: true,
        testId: status.testId,
        personalityType: status.personalityType,
        message: 'Test déjà complété',
      });
    }

    return res.json({
      completed: false,
      test: status.test,
    });
  } catch (error) {
    return next(error);
  }
};

export const submitTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  if (!userId) return next(new HttpError(401, 'Unauthorized'));

  const answers = req.body.answers;
  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers must be an array' });
  }

  try {
    const result = await submitUserPersonalityTest(userId, answers);
    return res.status(201).json({
      success: true,
      message: 'Test completed',
      data: result,
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) {
      return res.status(409).json({
        message: error.message,
        code: 'TEST_ALREADY_COMPLETED',
      });
    }
    return next(error);
  }
};

export const resetTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  if (!userId) return next(new HttpError(401, 'Unauthorized'));

  try {
    await resetUserPersonalityTest(userId);
    return res.json({ message: 'Personality test reset' });
  } catch (error) {
    return next(error);
  }
};
