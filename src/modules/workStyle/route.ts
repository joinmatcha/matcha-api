import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  getActiveWorkStyle,
  getMyWorkStyle,
  resetWorkStyle,
  submitWorkStyle,
} from '@/modules/workStyle/controller';
import { submitWorkStyleSchema } from '@/modules/workStyle/schema';

const router = Router();

router.get('/active', requireAuth, getActiveWorkStyle);
router.get('/me', requireAuth, getMyWorkStyle);
router.post('/reset', requireAuth, resetWorkStyle);
router.post(
  '/submit',
  requireAuth,
  validate(submitWorkStyleSchema),
  submitWorkStyle
);

export default router;
