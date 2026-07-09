import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { logger } from '@/utils/logger';

const SKIPPED_PATHS = ['/api-docs'];

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startedAt = process.hrtime.bigint();
  const requestId =
    req.header('x-request-id') || crypto.randomUUID().replace(/-/g, '');

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const shouldSkip = SKIPPED_PATHS.some((path) => req.path.startsWith(path));

  res.on('finish', () => {
    if (shouldSkip) return;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = res.statusCode;
    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level]('http_request', {
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode,
      durationMs: Math.round(durationMs),
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
    });
  });

  next();
};
