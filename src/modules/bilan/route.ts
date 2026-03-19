import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  generateBilan,
  getMyBilan,
  getQuestions,
  submitAnswers,
} from '@/modules/bilan/controller';
import {
  generateBilanSchema,
  submitAnswersSchema,
} from '@/modules/bilan/schema';

const router = Router();

router.get('/questions', requireAuth, getQuestions);

router.post(
  '/answers',
  requireAuth,
  validate(submitAnswersSchema),
  submitAnswers
);

router.post(
  '/generate',
  requireAuth,
  validate(generateBilanSchema),
  generateBilan
);

router.get('/me', requireAuth, getMyBilan);

export default router;
