import { NextFunction, Request, Response } from 'express';

import { buildMatchaProfile } from '@/services/matchaProfile/buildMatchaProfile';

export const getMyMatchaProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await buildMatchaProfile(req.user.id);

    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
};
