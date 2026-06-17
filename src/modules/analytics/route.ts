import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createAnalyticsEvent } from '@/modules/analytics/controller';
import { analyticsEventSchema } from '@/modules/analytics/schema';

const router = Router();

router.post(
  '/events',
  requireAuth,
  validate(analyticsEventSchema),
  createAnalyticsEvent
);

export default router;
