import { Router } from 'express';

import {
  generateBilan,
  getMyBilan,
  getQuestions,
  submitAnswers,
} from '@/controllers/bilan.controller';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  generateBilanSchema,
  submitAnswersSchema,
} from '@/validators/bilan.schema';

const router = Router();

router.get('/questions', requireAuth, getQuestions);

router.post(
  '/answers',
  requireAuth,
  validate(submitAnswersSchema),
  submitAnswers,
);

router.post(
  '/generate',
  requireAuth,
  validate(generateBilanSchema),
  generateBilan,
);

router.get('/me', requireAuth, getMyBilan);

export default router;
