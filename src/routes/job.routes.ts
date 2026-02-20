import { Router } from 'express';

import {
  getDeck,
  getJobById,
  getRecommendedJobs,
} from '@/controllers/job.controller';
import { requireAuth } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/deck', requireAuth, getDeck);
router.get('/recommended', requireAuth, getRecommendedJobs);
router.get('/:id', requireAuth, getJobById);

export default router;
