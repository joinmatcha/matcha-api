import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanCompetence } from '@/models/BilanCompetence';
import { Job } from '@/models/Job';
import User from '@/models/User';

const createUserAndGetToken = async () => {
  const email = `job-test-${Date.now()}@example.com`;

  const res = await request(app).post('/api/users').send({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'StrongPassw0rd!',
    consentAccepted: true,
  });

  const user = await User.findById(res.body.userId);
  if (!user) throw new Error('User not found');

  user.isEmailVerified = true;
  await user.save();

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'test-secret',
  );

  return { user, token };
};

const createMinimalBilan = async ({
  userId,
  recommendedJobs = [],
}: {
  userId: string;
  recommendedJobs?: any[];
}) => {
  return BilanCompetence.create({
    user: userId,
    version: 1,

    investigation: {
      topValues: [],
      topWorkConditions: [],
      interestsProfile: [],
    },

    conclusion: {
      archetype: {
        id: 'test-archetype',
        title: 'Profil test',
        subtitle: 'Profil de test',
        description: 'Description de test',
      },
      profileSummary: 'Résumé de test',
      keyStrengths: [],
      improvementAxes: [],
      recommendedEnvironments: [],
      recommendedJobs,
      actionPlan: [],
    },
  });
};

describe('Job routes', () => {
  beforeEach(async () => {
    await Job.deleteMany({});
    await BilanCompetence.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/job/recommended', () => {
    it('should return recommended jobs from latest bilan', async () => {
      const { user, token } = await createUserAndGetToken();

      await createMinimalBilan({
        userId: user._id.toString(),
        recommendedJobs: [
          {
            id: 'job-1',
            title: 'Développeur·se web',
            sector: 'Tech',
            description: 'Conçoit des applications web',
            score: 80,
          },
        ],
      });

      const res = await request(app)
        .get('/api/job/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.jobs[0].title).toBe('Développeur·se web');
      expect(res.body.jobs[0].score).toBeGreaterThan(0);
    });

    it('should return 404 if no bilan exists', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .get('/api/job/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/job/recommended');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/job/:id', () => {
    it('should return a job by id', async () => {
      const { token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Développeur·se web',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        description: 'Conçoit des applications web',
        growthOutlook: 'growing',
      });

      const res = await request(app)
        .get(`/api/job/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.job.title).toBe('Développeur·se web');
      expect(res.body.job.growthOutlook).toBe('growing');
    });

    it('should include recommendation if job is part of user bilan', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Développeur·se web',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        description: 'Conçoit des applications web',
        growthOutlook: 'growing',
      });

      await createMinimalBilan({
        userId: user._id.toString(),
        recommendedJobs: [
          {
            id: job._id.toString(),
            title: job.title,
            score: 75,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/job/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendation).toBeDefined();
      expect(res.body.recommendation.score).toBe(75);
    });

    it('should return 404 if job does not exist', async () => {
      const { token } = await createUserAndGetToken();

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/job/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid job id', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .get('/api/job/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should not return inactive jobs', async () => {
      const { token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Job inactif',
        isActive: false,
        riasec: ['RIASEC_I'],
        growthOutlook: 'stable',
      });

      const res = await request(app)
        .get(`/api/job/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
