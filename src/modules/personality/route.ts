import express from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  getActiveTest,
  resetTest,
  submitTest,
} from '@/modules/personality/controller';
import { submitPersonalitySchema } from '@/modules/personality/schema';

const router = express.Router();

router.get('/active', requireAuth, getActiveTest);

router.post(
  '/submit',
  requireAuth,
  validate(submitPersonalitySchema),
  submitTest,
);

router.post('/reset', requireAuth, resetTest);

export default router;
