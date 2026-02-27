import { Router } from 'express';

import { redirectToApp } from '@/modules/redirect/controller';

const router = Router();

router.get('/redirect-reset-password', redirectToApp);

export default router;
