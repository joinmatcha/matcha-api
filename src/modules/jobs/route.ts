import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  compareJobs,
  getDeck,
  getJobById,
  getRecommendedJobs,
  getTopLikedJobs,
  listJobs,
  swipeJob,
} from '@/modules/jobs/controller';
import {
  compareJobsSchema,
  jobIdParamsSchema,
  listJobsQuerySchema,
  swipeJobSchema,
  topLikedJobsQuerySchema,
} from '@/modules/jobs/schema';

const router = Router();

router.get('/', requireAuth, validate(listJobsQuerySchema, 'query'), listJobs);
router.get('/deck', requireAuth, getDeck);
router.get('/recommended', requireAuth, getRecommendedJobs);
router.get(
  '/top-liked',
  requireAuth,
  validate(topLikedJobsQuerySchema, 'query'),
  getTopLikedJobs
);
router.post('/compare', requireAuth, validate(compareJobsSchema), compareJobs);
router.post('/swipe', requireAuth, validate(swipeJobSchema), swipeJob);
router.get(
  '/:id',
  requireAuth,
  validate(jobIdParamsSchema, 'params'),
  getJobById
);

export default router;
