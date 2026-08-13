import express from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createUser,
  getMe,
  getPreferences,
  getUserById,
  resendVerificationEmail,
  verifyEmail,
} from '@/modules/users/controller';
import {
  createUserSchema,
  resendVerificationEmailSchema,
} from '@/modules/users/schema';

const router = express.Router();

router.post('/', validate(createUserSchema), createUser);

router.post(
  '/resend-verification',
  validate(resendVerificationEmailSchema),
  resendVerificationEmail
);

router.get('/verify-email', verifyEmail);

router.get('/me', requireAuth, getMe);

router.get('/me/preferences', requireAuth, getPreferences);

router.get('/:id', requireAuth, getUserById);

export default router;
