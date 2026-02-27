import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '@/config/env';

interface JwtPayload {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res
      .status(401)
      .json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
