import { Express } from 'express';

import authRoutes from '@/modules/auth/route';
import bilanRoutes from '@/modules/bilan/route';
import healthRoutes from '@/modules/health/route';
import jobsRoutes from '@/modules/jobs/route';
import personalityRoutes from '@/modules/personality/route';
import profileRoutes from '@/modules/profile/route';
import userRoutes from '@/modules/users/route';

export const registerRoutes = (app: Express): void => {
  app.use('/api/auth', authRoutes);
  app.use('/health', healthRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/personality', personalityRoutes);
  app.use('/api/bilan', bilanRoutes);
  app.use('/api/jobs', jobsRoutes);
};
