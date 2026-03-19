import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanCompetence } from '@/models/BilanCompetence';
import { Job } from '@/models/Job';
import { Swipe } from '@/models/Swipe';
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
    process.env.JWT_SECRET || 'test-secret'
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

describe('Jobs routes', () => {
  beforeEach(async () => {
    await Job.deleteMany({});
    await BilanCompetence.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/jobs/deck', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/jobs/deck');

      expect(res.status).toBe(401);
    });

    it('should return a deck with jobs, remaining and limit', async () => {
      const { token } = await createUserAndGetToken();

      await Job.create([
        {
          title: 'Développeur·se web',
          isActive: true,
          growthOutlook: 'stable',
          sector: 'Tech',
        },
        {
          title: 'Designer UX',
          isActive: true,
          growthOutlook: 'stable',
          sector: 'Design',
        },
      ]);

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(2);
      expect(res.body.remaining).toBe(20);
      expect(res.body.limit).toBe(20);
      expect(res.body.jobs[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
      });
    });

    it('should return empty deck when daily quota is reached', async () => {
      const { user, token } = await createUserAndGetToken();

      await Promise.all(
        Array.from({ length: 20 }).map(() =>
          Swipe.create({
            userId: user._id,
            jobId: new mongoose.Types.ObjectId(),
            action: 'like',
            swipedAt: new Date(),
          })
        )
      );

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(0);
      expect(res.body.remaining).toBe(0);
      expect(res.body.limit).toBe(20);
    });

    it('should exclude jobs already swiped today', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Développeur·se web',
        isActive: true,
        growthOutlook: 'stable',
      });

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'like',
        swipedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs.map((j: any) => j.id)).not.toContain(
        job._id.toString()
      );
    });

    it('should exclude jobs disliked within the last 30 days', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Développeur·se web',
        isActive: true,
        growthOutlook: 'stable',
      });

      const recentDislike = new Date();
      recentDislike.setDate(recentDislike.getDate() - 10);

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'dislike',
        swipedAt: recentDislike,
      });

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs.map((j: any) => j.id)).not.toContain(
        job._id.toString()
      );
    });

    it('should include jobs disliked more than 30 days ago', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Développeur·se web',
        isActive: true,
        growthOutlook: 'stable',
      });

      const oldDislike = new Date();
      oldDislike.setDate(oldDislike.getDate() - 31);

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'dislike',
        swipedAt: oldDislike,
      });

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs.map((j: any) => j.id)).toContain(job._id.toString());
    });
  });

  describe('GET /api/jobs', () => {
    it('should list active jobs with normalized shape', async () => {
      const { token } = await createUserAndGetToken();

      await Job.create([
        {
          title: 'Développeur backend',
          isActive: true,
          growthOutlook: 'growing',
          sector: 'Tech',
          tags: ['Node.js'],
        },
        {
          title: 'Commercial',
          isActive: false,
          growthOutlook: 'stable',
          sector: 'Sales',
          tags: ['B2B'],
        },
      ]);

      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.jobs[0]).toMatchObject({
        id: expect.any(String),
        title: 'Développeur backend',
        sector: 'Tech',
        growthOutlook: 'growing',
      });
    });

    it('should filter jobs with q and sector', async () => {
      const { token } = await createUserAndGetToken();

      await Job.create([
        {
          title: 'Développeur frontend',
          isActive: true,
          growthOutlook: 'stable',
          sector: 'Tech',
        },
        {
          title: 'Chef de projet marketing',
          isActive: true,
          growthOutlook: 'stable',
          sector: 'Marketing',
        },
      ]);

      const res = await request(app)
        .get('/api/jobs')
        .query({ q: 'développeur', sector: 'Tech' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.jobs[0].title).toBe('Développeur frontend');
    });
  });

  describe('POST /api/jobs/swipe', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/api/jobs/swipe').send({
        jobId: new mongoose.Types.ObjectId().toString(),
        action: 'like',
      });

      expect(res.status).toBe(401);
    });

    it('should return 400 if jobId is missing', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'like' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if action is missing', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: new mongoose.Types.ObjectId().toString() });

      expect(res.status).toBe(400);
    });

    it('should return 400 if action is invalid', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobId: new mongoose.Types.ObjectId().toString(),
          action: 'neutral',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 if jobId is not a valid ObjectId', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: 'not-an-id', action: 'like' });

      expect(res.status).toBe(400);
    });

    it('should return 404 if job does not exist', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobId: new mongoose.Types.ObjectId().toString(),
          action: 'like',
        });

      expect(res.status).toBe(404);
    });

    it('should return 201 and record a like', async () => {
      const { token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Dev',
        isActive: true,
        growthOutlook: 'stable',
      });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'like' });

      expect(res.status).toBe(201);
      expect(res.body.swipe.action).toBe('like');
      expect(res.body.swipe.jobId).toBe(job._id.toString());
      expect(res.body.remaining).toBe(19);
      expect(res.body.limit).toBe(20);
    });

    it('should return 201 and record a dislike', async () => {
      const { token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Dev',
        isActive: true,
        growthOutlook: 'stable',
      });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'dislike' });

      expect(res.status).toBe(201);
      expect(res.body.swipe.action).toBe('dislike');
    });

    it('should return 429 when daily quota is reached', async () => {
      const { user, token } = await createUserAndGetToken();

      await Promise.all(
        Array.from({ length: 20 }).map(() =>
          Swipe.create({
            userId: user._id,
            jobId: new mongoose.Types.ObjectId(),
            action: 'like',
            swipedAt: new Date(),
          })
        )
      );

      const job = await Job.create({
        title: 'Dev',
        isActive: true,
        growthOutlook: 'stable',
      });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'like' });

      expect(res.status).toBe(429);
      expect(res.body.remaining).toBe(0);
    });

    it('should return 409 if job was already swiped today', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await Job.create({
        title: 'Dev',
        isActive: true,
        growthOutlook: 'stable',
      });

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'like',
        swipedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'like' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/jobs/recommended', () => {
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
        .get('/api/jobs/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.jobs[0].title).toBe('Développeur·se web');
      expect(res.body.jobs[0].score).toBeGreaterThan(0);
    });

    it('should return 404 if no bilan exists', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .get('/api/jobs/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/jobs/recommended');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/jobs/:id', () => {
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
        .get(`/api/jobs/${job._id}`)
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
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendation).toBeDefined();
      expect(res.body.recommendation.score).toBe(75);
    });

    it('should return 404 if job does not exist', async () => {
      const { token } = await createUserAndGetToken();

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid job id', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .get('/api/jobs/invalid-id')
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
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
