import { Router } from 'express';

import { createRateLimiter } from '@/middlewares/rateLimit.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  login,
  requestPasswordReset,
  resetPassword,
} from '@/modules/auth/controller';
import {
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '@/modules/auth/schema';

const router = Router();

const loginLimiter = createRateLimiter({
  max: 10,
  windowMs: 10 * 60 * 1000,
  message: 'Too many login attempts, please try again later.',
});

const requestResetLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: 'Too many reset requests, please try again later.',
});

router.post('/login', loginLimiter, validate(loginSchema), login);

router.post(
  '/request-reset',
  requestResetLimiter,
  validate(requestPasswordResetSchema),
  requestPasswordReset,
);

router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
