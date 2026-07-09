import { Router } from 'express';

import { requireAuth } from '@/middlewares/auth.middleware';
import { getMyMatchaProfile } from '@/modules/matchaProfile/controller';

const router = Router();

router.get('/me', requireAuth, getMyMatchaProfile);

export default router;
