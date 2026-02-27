import express from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import {
  getActiveTest,
  resetTest,
  submitTest,
} from '@/modules/personality/controller';

const router = express.Router();

router.get('/active', requireAuth, getActiveTest);

router.post('/submit', requireAuth, submitTest);

router.post('/reset', requireAuth, resetTest);

export default router;
