import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  getDeck,
  getJobById,
  getRecommendedJobs,
  listJobs,
  swipeJob,
} from '@/modules/jobs/controller';
import {
  jobIdParamsSchema,
  listJobsQuerySchema,
  swipeJobSchema,
} from '@/modules/jobs/schema';

const router = Router();

router.get('/', requireAuth, validate(listJobsQuerySchema, 'query'), listJobs);
router.get('/deck', requireAuth, getDeck);
router.get('/recommended', requireAuth, getRecommendedJobs);
router.post('/swipe', requireAuth, validate(swipeJobSchema), swipeJob);
router.get(
  '/:id',
  requireAuth,
  validate(jobIdParamsSchema, 'params'),
  getJobById
);

export default router;
