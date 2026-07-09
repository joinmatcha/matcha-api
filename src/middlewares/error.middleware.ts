import { NextFunction, Request, Response } from 'express';

import { logger } from '@/utils/logger';

interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  void next;
  const statusCode = err.status || 500;

  logger[statusCode >= 500 ? 'error' : 'warn']('request_error', {
    requestId: _req.requestId,
    method: _req.method,
    path: (_req.originalUrl ?? _req.url ?? _req.path ?? '').split('?')[0],
    statusCode,
    userId: _req.user?.id,
    error: err,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    requestId: _req.requestId,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
