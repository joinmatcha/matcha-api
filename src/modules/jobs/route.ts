import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  compareJobs,
  decideJobMatching,
  getDeck,
  getJobById,
  getJobMatching,
  getRecommendedJobs,
  getTopLikedJobs,
  listJobs,
  resetJobMatching,
  swipeJob,
} from '@/modules/jobs/controller';
import {
  compareJobsSchema,
  jobIdParamsSchema,
  listJobsQuerySchema,
  matchingDecisionSchema,
  swipeJobSchema,
  topLikedJobsQuerySchema,
} from '@/modules/jobs/schema';

const router = Router();

router.get('/', requireAuth, validate(listJobsQuerySchema, 'query'), listJobs);
router.get('/deck', requireAuth, getDeck);
router.get('/recommended', requireAuth, getRecommendedJobs);
router.get('/matching', requireAuth, getJobMatching);
router.post(
  '/matching/decision',
  requireAuth,
  validate(matchingDecisionSchema),
  decideJobMatching
);
router.delete('/matching/reset', requireAuth, resetJobMatching);
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
