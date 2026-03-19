import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  changePassword,
  deleteAccount,
  getProfile,
  requestEmailChange,
  updateProfile,
} from '@/modules/profile/controller';
import {
  changePasswordSchema,
  requestEmailChangeSchema,
  updateProfileSchema,
} from '@/modules/profile/schema';

const router = Router();

router.patch('/', requireAuth, validate(updateProfileSchema), updateProfile);

router.get('/', requireAuth, getProfile);

router.delete('/account', requireAuth, deleteAccount);

router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  changePassword
);

router.post(
  '/request-email-change',
  requireAuth,
  validate(requestEmailChangeSchema),
  requestEmailChange
);

export default router;
