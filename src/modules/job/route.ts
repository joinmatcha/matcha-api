import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import {
  getDeck,
  getJobById,
  getRecommendedJobs,
  swipeJob,
} from '@/modules/job/controller';

const router = Router();

router.get('/deck', requireAuth, getDeck);
router.get('/recommended', requireAuth, getRecommendedJobs);
router.post('/swipe', requireAuth, swipeJob);
router.get('/:id', requireAuth, getJobById);

export default router;
