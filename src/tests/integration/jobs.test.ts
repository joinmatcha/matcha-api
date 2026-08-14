import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanCompetence } from '@/models/BilanCompetence';
import { MatchingDecision } from '@/models/MatchingDecision';
import PersonalityTest from '@/models/PersonalityTest';
import { RecommendationProfile } from '@/models/RecommendationProfile';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
import { Swipe } from '@/models/Swipe';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { ALGORITHM_VERSION } from '@/services/jobs/profileMatching';
import { buildRomeMetier, createRomeMetier } from '@/tests/helpers/rome';

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
  suggestedSectors = [],
}: {
  userId: string;
  suggestedSectors?: any[];
}) => {
  return BilanCompetence.create({
    user: userId,
    version: 1,

    investigation: {
      competence: { strengths: ['analysis'], acquired: [], toImprove: [] },
      softSkills: { strengths: ['autonomy'], acquired: [], toImprove: [] },
      topValues: [],
      topWorkConditions: ['remote'],
      interestsProfile: ['RIASEC_I'],
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
      recommendedSectors: [],
      suggestedSectors,
      actionPlan: [],
    },
  });
};

const createMinimalPersonality = async (userId: string) => {
  const test = await PersonalityTest.create({
    userId,
    templateId: new mongoose.Types.ObjectId(),
    templateVersion: '1',
    answers: [],
    type: 'INTP',
    result: 'Penseur',
    description: 'Profil analytique.',
    traits: ['analysis'],
    weaknesses: [],
    suggestedSectors: ['Tech'],
    scoreBreakdown: { EI: -2, SN: -2, TF: 2, JP: 0 },
  });

  await User.findByIdAndUpdate(userId, { personalityTestId: test._id });
};

const createMinimalWorkStyle = async (userId: string) => {
  await WorkStyleResult.create({
    user: userId,
    versionId: new mongoose.Types.ObjectId(),
    version: 1,
    answers: [],
    scores: {
      autonomy: 80,
      collaboration: 45,
      pace: 50,
      structure: 60,
      variety: 55,
      human_contact: 35,
      mobility: 20,
      learning: 85,
    },
    topAxes: ['autonomy', 'learning'],
    profile: {
      key: 'autonomous_structured',
      title: 'Autonome structuré',
      description: 'Cadre clair et autonomie.',
      strengths: ['Autonomie', 'Apprentissage'],
      cautions: [],
      advice: [],
    },
  });
};

describe('Jobs routes', () => {
  beforeEach(async () => {
    await RomeMetier.deleteMany({});
    await RomeMarketStat.deleteMany({});
    await BilanCompetence.deleteMany({});
    await PersonalityTest.deleteMany({});
    await RecommendationProfile.deleteMany({});
    await MatchingDecision.deleteMany({});
    await WorkStyleResult.deleteMany({});
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

      await RomeMetier.create([
        buildRomeMetier({
          code: 'M1805',
          label: 'Développeur·se web',
          domain: { label: 'Tech' },
        }),
        buildRomeMetier({
          code: 'B1603',
          label: 'Designer UX',
          domain: { label: 'Design' },
        }),
      ]);

      const res = await request(app)
        .get('/api/jobs/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(2);
      expect(res.body.remaining).toBe(10);
      expect(res.body.limit).toBe(10);
      expect(res.body.jobs[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
      });
    });

    it('should return empty deck when daily quota is reached', async () => {
      const { user, token } = await createUserAndGetToken();

      await Promise.all(
        Array.from({ length: 10 }).map(() =>
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
      expect(res.body.limit).toBe(10);
    });

    it('should exclude jobs already swiped today', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await createRomeMetier({ label: 'Développeur·se web' });

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

    it('should exclude previously liked jobs from future decks', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await createRomeMetier({ label: 'Développeur·se web' });

      const oldLike = new Date();
      oldLike.setDate(oldLike.getDate() - 14);

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'like',
        swipedAt: oldLike,
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

      const job = await createRomeMetier({ label: 'Développeur·se web' });

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

      const job = await createRomeMetier({ label: 'Développeur·se web' });

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

      await RomeMetier.create([
        buildRomeMetier({
          code: 'M1805',
          label: 'Développeur backend',
          domain: { label: 'Tech' },
          themes: [{ label: 'Node.js' }],
        }),
        buildRomeMetier({
          code: 'D1402',
          label: 'Commercial',
          isActive: false,
          domain: { label: 'Sales' },
          themes: [{ label: 'B2B' }],
        }),
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
        growthOutlook: 'unknown',
      });
    });

    it('should filter jobs with q and sector', async () => {
      const { token } = await createUserAndGetToken();

      await RomeMetier.create([
        buildRomeMetier({
          code: 'M1805',
          label: 'Développeur frontend',
          domain: { label: 'Tech' },
        }),
        buildRomeMetier({
          code: 'E1103',
          label: 'Chef de projet marketing',
          domain: { label: 'Marketing' },
        }),
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

      const job = await createRomeMetier({ label: 'Dev' });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'like' });

      expect(res.status).toBe(201);
      expect(res.body.swipe.action).toBe('like');
      expect(res.body.swipe.jobId).toBe(job._id.toString());
      expect(res.body.remaining).toBe(9);
      expect(res.body.limit).toBe(10);
    });

    it('should return 201 and record a dislike', async () => {
      const { token } = await createUserAndGetToken();

      const job = await createRomeMetier({ label: 'Dev' });

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
        Array.from({ length: 10 }).map(() =>
          Swipe.create({
            userId: user._id,
            jobId: new mongoose.Types.ObjectId(),
            action: 'like',
            swipedAt: new Date(),
          })
        )
      );

      const job = await createRomeMetier({ label: 'Dev' });

      const res = await request(app)
        .post('/api/jobs/swipe')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobId: job._id.toString(), action: 'like' });

      expect(res.status).toBe(429);
      expect(res.body.remaining).toBe(0);
    });

    it('should return 409 if job was already swiped today', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await createRomeMetier({ label: 'Dev' });

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

  describe('GET /api/jobs/top-liked', () => {
    it('should return the most liked jobs for the authenticated user', async () => {
      const { user, token } = await createUserAndGetToken();
      const otherUserId = new mongoose.Types.ObjectId();

      const first = await createRomeMetier({
        code: 'M1805',
        label: 'Développeur·se web',
        domain: { label: 'Tech' },
      });
      const second = await createRomeMetier({
        code: 'B1603',
        label: 'Designer UX',
        domain: { label: 'Design' },
      });
      const third = await createRomeMetier({
        code: 'D1402',
        label: 'Commercial',
        domain: { label: 'Commerce' },
      });

      await Swipe.create([
        {
          userId: user._id,
          jobId: first._id,
          action: 'like',
          dayKey: '2026-04-20',
        },
        {
          userId: user._id,
          jobId: first._id,
          action: 'like',
          dayKey: '2026-04-21',
        },
        {
          userId: user._id,
          jobId: second._id,
          action: 'like',
          dayKey: '2026-04-20',
        },
        {
          userId: user._id,
          jobId: third._id,
          action: 'dislike',
          dayKey: '2026-04-20',
        },
        {
          userId: otherUserId,
          jobId: third._id,
          action: 'like',
          dayKey: '2026-04-20',
        },
      ]);

      const res = await request(app)
        .get('/api/jobs/top-liked')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.jobs).toHaveLength(2);
      expect(res.body.jobs[0]).toMatchObject({
        id: first._id.toString(),
        title: 'Développeur·se web',
        likesCount: 2,
      });
      expect(res.body.jobs[1]).toMatchObject({
        id: second._id.toString(),
        likesCount: 1,
      });
    });
  });

  describe('GET /api/jobs/recommended', () => {
    it('should return matched jobs when the recommendation profile is unlocked', async () => {
      const { user, token } = await createUserAndGetToken();
      await RomeMetier.create(
        buildRomeMetier({
          code: 'M1805',
          label: 'Développeur·se web',
          domain: { label: 'Tech' },
          riasec: { major: 'I', codes: ['RIASEC_I'] },
          skills: [{ label: 'analysis', isMain: true }],
          workContexts: [{ label: 'remote' }, { label: 'innovation' }],
        })
      );

      await createMinimalBilan({
        userId: user._id.toString(),
      });
      await createMinimalPersonality(user._id.toString());
      await createMinimalWorkStyle(user._id.toString());

      const res = await request(app)
        .get('/api/jobs/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.unlocked).toBe(true);
      expect(res.body.jobs).toHaveLength(1);
      expect(res.body.jobs[0].title).toBe('Développeur·se web');
      expect(res.body.jobs[0].score).toBeGreaterThan(0);
    });

    it('should return locked recommendation state when tests are missing', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .get('/api/jobs/recommended')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.unlocked).toBe(false);
      expect(res.body.missingTests).toEqual(
        expect.arrayContaining(['bilan', 'personality', 'work_style'])
      );
      expect(res.body.jobs).toHaveLength(0);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/jobs/recommended');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/jobs/compare', () => {
    it('should compare 2 or 3 active jobs using the latest bilan', async () => {
      const { user, token } = await createUserAndGetToken();
      const first = await createRomeMetier({
        code: 'M1805',
        label: 'Développeur web',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [
          { label: 'analysis', isMain: true },
          { label: 'testing', isMain: true },
        ],
        workContexts: [{ label: 'remote' }],
        accessToJob: 'Formation en développement web',
      });
      const second = await createRomeMetier({
        code: 'M1403',
        label: 'Data analyst',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [
          { label: 'analysis', isMain: true },
          { label: 'sql', isMain: true },
        ],
        workContexts: [{ label: 'hybrid' }],
      });

      await createMinimalBilan({ userId: user._id.toString() });
      await RomeMarketStat.create({
        metierId: first._id,
        metierCode: first.code,
        metierLabel: first.label,
        territory: { type: 'NAT', code: 'FR', label: 'France' },
        tension: {
          label: 'Tension',
          values: [{ label: 'Forte' }],
        },
        lastSyncedAt: new Date('2026-01-01'),
      });

      const res = await request(app)
        .post('/api/jobs/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobIds: [first._id.toString(), second._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.context).toMatchObject({
        interestsProfile: ['RIASEC_I'],
        strengths: ['Analyse', 'Autonomie'],
        workConditions: ['Télétravail'],
      });
      expect(res.body.jobs).toHaveLength(2);
      expect(res.body.jobs[0]).toMatchObject({
        id: first._id.toString(),
        title: 'Développeur web',
        matchScore: expect.any(Number),
        matchReasons: expect.arrayContaining([
          'Compatible avec ton profil d’intérêts',
          'Mobilise des compétences proches de ton profil',
        ]),
        matchedSkills: ['analysis'],
        skillsToDevelop: ['testing'],
        matchedWorkConditions: ['remote'],
        market: {
          territory: { type: 'NAT', code: 'FR', label: 'France' },
        },
      });
      expect(res.body.jobs[1].title).toBe('Data analyst');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/jobs/compare')
        .send({
          jobIds: [
            new mongoose.Types.ObjectId().toString(),
            new mongoose.Types.ObjectId().toString(),
          ],
        });

      expect(res.status).toBe(401);
    });

    it('should validate the number of jobs', async () => {
      const { token } = await createUserAndGetToken();

      const res = await request(app)
        .post('/api/jobs/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobIds: [new mongoose.Types.ObjectId().toString()] });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate job ids', async () => {
      const { token } = await createUserAndGetToken();
      const id = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/jobs/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({ jobIds: [id, id] });

      expect(res.status).toBe(400);
    });

    it('should return 404 when the user has no bilan', async () => {
      const { token } = await createUserAndGetToken();
      const first = await createRomeMetier();
      const second = await createRomeMetier();

      const res = await request(app)
        .post('/api/jobs/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobIds: [first._id.toString(), second._id.toString()],
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No bilan found');
    });

    it('should return 404 when one job is inactive', async () => {
      const { user, token } = await createUserAndGetToken();
      const active = await createRomeMetier();
      const inactive = await createRomeMetier({ isActive: false });
      await createMinimalBilan({ userId: user._id.toString() });

      const res = await request(app)
        .post('/api/jobs/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobIds: [active._id.toString(), inactive._id.toString()],
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('One or more jobs were not found');
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return a job by id', async () => {
      const { token } = await createUserAndGetToken();

      const job = await createRomeMetier({
        label: 'Développeur·se web',
        definition: 'Conçoit des applications web',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }],
        workContexts: [{ label: 'remote' }],
      });

      const res = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.job.title).toBe('Développeur·se web');
      expect(res.body.job.growthOutlook).toBe('unknown');
    });

    it('should include recommendation if job is part of the user matching profile', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await createRomeMetier({
        label: 'Développeur·se web',
        definition: 'Conçoit des applications web',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }],
        workContexts: [{ label: 'remote' }],
      });

      await RecommendationProfile.create({
        user: user._id,
        algorithmVersion: 'test',
        completedSources: ['bilan', 'personality', 'work_style'],
        missingSources: [],
        unlocked: true,
        matchedJobs: [
          {
            jobId: job._id,
            code: job.code,
            title: job.label,
            sector: job.domain?.label,
            score: 75,
            reasons: ['Profil global compatible'],
          },
        ],
        recalculatedAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendation).toBeDefined();
      expect(res.body.recommendation.score).toBe(75);
    });

    it('should include work style compatibility when available', async () => {
      const { user, token } = await createUserAndGetToken();

      const job = await createRomeMetier({
        label: 'Conseiller relation client',
        definition: 'Accompagne et conseille le public',
        workContexts: [{ label: 'Contact client' }],
        skills: [{ label: 'Relation client' }],
      });

      await WorkStyleResult.create({
        user: user._id,
        versionId: new mongoose.Types.ObjectId(),
        version: 1,
        answers: [],
        scores: {
          autonomy: 50,
          collaboration: 80,
          pace: 60,
          structure: 50,
          variety: 50,
          human_contact: 100,
          mobility: 50,
          learning: 50,
        },
        topAxes: ['human_contact', 'collaboration'],
        profile: {
          key: 'collaborative_dynamic',
          title: 'Collaboratif dynamique',
          description: 'Description',
          strengths: [],
          cautions: [],
          advice: [],
        },
      });

      const res = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.job.workStyleCompatibility).toMatchObject({
        level: expect.any(String),
        label: expect.stringContaining('style professionnel'),
      });
      expect(
        res.body.job.workStyleCompatibility.reasons.length
      ).toBeGreaterThan(0);
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

      const job = await createRomeMetier({
        label: 'Job inactif',
        isActive: false,
        riasec: { major: 'I', codes: ['RIASEC_I'] },
      });

      const res = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/jobs/matching', () => {
    async function createMatchingProfile(userId: mongoose.Types.ObjectId) {
      const jobIds = Array.from(
        { length: 3 },
        () => new mongoose.Types.ObjectId()
      );

      await RecommendationProfile.create({
        user: userId,
        algorithmVersion: ALGORITHM_VERSION,
        completedSources: ['bilan', 'personality', 'work_style'],
        missingSources: [],
        unlocked: true,
        sectors: [
          {
            key: 'tech',
            label: 'Tech',
            weight: 3,
            sources: ['Auto-évaluation'],
          },
        ],
        matchedJobs: jobIds.map((jobId, index) => ({
          jobId,
          code: `M180${index}`,
          title: `Métier matché ${index + 1}`,
          sector: 'Tech',
          score: 90 - index,
          reasons: ['Compatible avec le profil consolidé'],
        })),
        recalculatedAt: new Date(),
      });

      return jobIds;
    }

    it('should expose matched jobs without daily deck quota', async () => {
      const { user, token } = await createUserAndGetToken();
      await createMatchingProfile(user._id);

      const res = await request(app)
        .get('/api/jobs/matching')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        unlocked: true,
        total: 3,
        remaining: 3,
        completed: false,
      });
      expect(res.body.jobs).toHaveLength(3);
      expect(res.body.jobs[0]).toMatchObject({
        title: 'Métier matché 1',
        decision: null,
      });
    });

    it('should complete, show liked jobs and reset matching decisions', async () => {
      const { user, token } = await createUserAndGetToken();
      const [likedJobId, dislikedJobId, secondLikedJobId] =
        await createMatchingProfile(user._id);

      for (const [jobId, action] of [
        [likedJobId, 'like'],
        [dislikedJobId, 'dislike'],
        [secondLikedJobId, 'like'],
      ] as const) {
        const decisionRes = await request(app)
          .post('/api/jobs/matching/decision')
          .set('Authorization', `Bearer ${token}`)
          .send({ jobId: jobId.toString(), action });

        expect(decisionRes.status).toBe(200);
      }

      const completedRes = await request(app)
        .get('/api/jobs/matching')
        .set('Authorization', `Bearer ${token}`);

      expect(completedRes.body).toMatchObject({
        total: 3,
        remaining: 0,
        completed: true,
      });
      expect(completedRes.body.likedJobs.map((job: any) => job.id)).toEqual([
        likedJobId.toString(),
        secondLikedJobId.toString(),
      ]);

      const resetRes = await request(app)
        .delete('/api/jobs/matching/reset')
        .set('Authorization', `Bearer ${token}`);

      expect(resetRes.status).toBe(200);
      expect(resetRes.body).toMatchObject({
        total: 3,
        remaining: 3,
        completed: false,
      });
      expect(await MatchingDecision.countDocuments({ userId: user._id })).toBe(
        0
      );
    });

    it('should reject decisions outside the current matching', async () => {
      const { user, token } = await createUserAndGetToken();
      await createMatchingProfile(user._id);

      const res = await request(app)
        .post('/api/jobs/matching/decision')
        .set('Authorization', `Bearer ${token}`)
        .send({
          jobId: new mongoose.Types.ObjectId().toString(),
          action: 'like',
        });

      expect(res.status).toBe(404);
    });
  });
});
