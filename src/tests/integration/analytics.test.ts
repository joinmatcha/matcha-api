import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { AnalyticsEvent } from '@/models/AnalyticsEvent';
import { BilanCompetence } from '@/models/BilanCompetence';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';

async function createUserToken(role: 'user' | 'admin' = 'user') {
  const user = await User.create({
    email: `analytics-${role}-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: 'hashed-password',
    firstName: 'Analytics',
    lastName: 'User',
    consentAccepted: true,
    isEmailVerified: true,
    role,
  });

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role },
    process.env.JWT_SECRET || 'test-secret'
  );

  return { user, token };
}

async function createAdminToken() {
  const { token } = await createUserToken('admin');
  return token;
}

describe('Analytics routes', () => {
  beforeEach(async () => {
    await AnalyticsEvent.deleteMany({});
    await BilanCompetence.deleteMany({});
    await WorkStyleResult.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/analytics/events', () => {
    it('should reject unauthenticated tracking calls', async () => {
      const res = await request(app).post('/api/analytics/events').send({
        eventType: 'test_started',
        sessionId: 'session-1',
        source: 'mobile',
      });

      expect(res.status).toBe(401);
    });

    it('should validate analytics event payloads', async () => {
      const { token } = await createUserToken();

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'unknown_event',
          sessionId: '',
          source: 'mobile',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should store events with a pseudonymized user hash', async () => {
      const { user, token } = await createUserToken();

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'job_viewed',
          sessionId: 'session-1',
          source: 'mobile',
          entityType: 'job',
          entityId: 'K1801',
          metadata: {
            jobTitle: 'Conseiller en insertion professionnelle',
            domain: 'Action sociale',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const event = await AnalyticsEvent.findOne({ entityId: 'K1801' }).lean();
      expect(event).toBeTruthy();
      expect(event?.userHash).toEqual(expect.any(String));
      expect(event?.userHash).not.toBe(user._id.toString());
      expect(event?.metadata).toMatchObject({
        jobTitle: 'Conseiller en insertion professionnelle',
        domain: 'Action sociale',
      });
    });

    it('should store optional tracking fields and default metadata safely', async () => {
      const { token } = await createUserToken();
      const occurredAt = '2026-06-18T08:30:00.000Z';

      const res = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          eventType: 'test_started',
          sessionId: 'session-optional-fields',
          source: 'mobile',
          entityType: 'personality',
          entityId: 'personality-v1',
          occurredAt,
          appVersion: '1.2.3',
        });

      expect(res.status).toBe(201);

      const event = await AnalyticsEvent.findOne({
        sessionId: 'session-optional-fields',
      }).lean();

      expect(event).toMatchObject({
        eventType: 'test_started',
        entityType: 'personality',
        entityId: 'personality-v1',
        appVersion: '1.2.3',
      });
      expect(event?.metadata ?? {}).toEqual({});
      expect(event?.occurredAt.toISOString()).toBe(occurredAt);
    });
  });

  describe('GET /api/admin/insights/*', () => {
    it('should expose overview, jobs and orientation metrics to admins', async () => {
      const { user } = await createUserToken('user');
      const { token: adminToken } = await createUserToken('admin');
      const userToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'test-secret'
      );

      await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'test_started',
          sessionId: 'session-admin-1',
          source: 'mobile',
          entityType: 'bilan',
          entityId: 'bilan-v2',
        });

      await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'test_completed',
          sessionId: 'session-admin-1',
          source: 'mobile',
          entityType: 'bilan',
          entityId: 'bilan-v2',
        });

      await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'job_swiped',
          sessionId: 'session-admin-1',
          source: 'mobile',
          entityType: 'job',
          entityId: 'K1801',
          metadata: {
            action: 'like',
            jobTitle: 'Conseiller en insertion professionnelle',
            domain: 'Action sociale',
          },
        });

      await BilanCompetence.create({
        user: user._id,
        version: 2,
        rawAnswers: [],
        scores: {
          competence: {},
          soft_skill: {},
          value: {},
          work_condition: {},
          interest: {},
          feasibility: {},
        },
        investigation: {
          competence: {
            strengths: ['communication'],
            acquired: [],
            toImprove: ['organization'],
          },
          softSkills: {
            strengths: ['adaptability'],
            acquired: [],
            toImprove: [],
          },
          topValues: ['impact'],
          topWorkConditions: ['autonomy'],
          interestsProfile: ['RIASEC_S'],
          feasibilityProfile: [],
        },
        conclusion: {
          archetype: {
            id: 'seed',
            title: 'Seed',
            subtitle: 'Seed',
            description: 'Seed',
          },
          profileSummary: 'Seed',
          keyStrengths: [],
          improvementAxes: [],
          recommendedEnvironments: [],
          recommendedJobs: [],
          actionPlan: [],
        },
      });

      await WorkStyleResult.create({
        user: user._id,
        versionId: new mongoose.Types.ObjectId(),
        version: 1,
        answers: [],
        scores: {
          autonomy: 80,
          collaboration: 60,
          pace: 55,
          structure: 70,
          variety: 50,
          human_contact: 65,
          mobility: 40,
          learning: 75,
        },
        topAxes: ['autonomy', 'structure', 'learning'],
        profile: {
          key: 'autonomous_structured',
          title: 'Autonome structuré',
          description: 'Seed',
          strengths: [],
          cautions: [],
          advice: [],
        },
      });

      const overviewRes = await request(app)
        .get('/api/admin/insights/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body).toMatchObject({
        totalEvents: 3,
        activeUsers: 1,
        testsStarted: 1,
        testsCompleted: 1,
        completionRate: 100,
        likes: 1,
      });

      const jobsRes = await request(app)
        .get('/api/admin/insights/jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(jobsRes.status).toBe(200);
      expect(jobsRes.body.liked[0]).toMatchObject({
        jobId: 'K1801',
        count: 1,
      });

      const orientationRes = await request(app)
        .get('/api/admin/insights/orientation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(orientationRes.status).toBe(200);
      expect(orientationRes.body.competenceStrengths[0]).toMatchObject({
        key: 'communication',
        count: 1,
      });
      expect(orientationRes.body.workStyleProfiles[0]).toMatchObject({
        key: 'autonomous_structured',
        count: 1,
      });
    });

    it('should expose activity and test funnel metrics with date filters', async () => {
      const adminToken = await createAdminToken();
      const insideDate = new Date('2026-06-18T10:00:00.000Z');
      const outsideDate = new Date('2026-06-10T10:00:00.000Z');

      await AnalyticsEvent.create([
        {
          eventType: 'test_started',
          userHash: 'user-a',
          sessionId: 'session-funnel-a',
          source: 'mobile',
          entityType: 'personality',
          entityId: 'personality-v1',
          metadata: {},
          occurredAt: insideDate,
          receivedAt: insideDate,
        },
        {
          eventType: 'test_completed',
          userHash: 'user-a',
          sessionId: 'session-funnel-a',
          source: 'mobile',
          entityType: 'personality',
          entityId: 'personality-v1',
          metadata: {},
          occurredAt: insideDate,
          receivedAt: insideDate,
        },
        {
          eventType: 'test_abandoned',
          userHash: 'user-b',
          sessionId: 'session-funnel-b',
          source: 'mobile',
          entityType: 'personality',
          entityId: 'personality-v1',
          stepId: 'personality-4',
          metadata: {},
          occurredAt: insideDate,
          receivedAt: insideDate,
        },
        {
          eventType: 'test_started',
          userHash: 'user-old',
          sessionId: 'session-outside-range',
          source: 'mobile',
          entityType: 'bilan',
          entityId: 'bilan-v2',
          metadata: {},
          occurredAt: outsideDate,
          receivedAt: outsideDate,
        },
      ]);

      const range = {
        from: '2026-06-18T00:00:00.000Z',
        to: '2026-06-18T23:59:59.999Z',
      };

      const activityRes = await request(app)
        .get('/api/admin/insights/activity')
        .query(range)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activityRes.status).toBe(200);
      expect(activityRes.body.activity).toEqual([
        {
          day: '2026-06-18',
          events: 3,
          activeUsers: 2,
          testsCompleted: 1,
        },
      ]);

      const testsRes = await request(app)
        .get('/api/admin/insights/tests')
        .query(range)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(testsRes.status).toBe(200);
      expect(testsRes.body.tests).toEqual([
        {
          entityType: 'personality',
          label: 'Test de personnalité',
          started: 1,
          completed: 1,
          abandoned: 1,
          completionRate: 100,
          abandonmentRate: 100,
          topAbandonStep: {
            stepId: 'personality-4',
            count: 1,
          },
        },
      ]);
    });

    it('should expose job rankings, domains, dislikes and recommendation gaps', async () => {
      const adminToken = await createAdminToken();
      const receivedAt = new Date('2026-06-18T12:00:00.000Z');

      await AnalyticsEvent.create([
        {
          eventType: 'job_matched',
          userHash: 'user-a',
          sessionId: 'session-jobs-a',
          source: 'mobile',
          entityType: 'job',
          entityId: 'K1801',
          metadata: {
            jobTitle: 'Conseiller insertion',
            domain: 'Action sociale',
          },
          occurredAt: receivedAt,
          receivedAt,
        },
        {
          eventType: 'job_matched',
          userHash: 'user-b',
          sessionId: 'session-jobs-b',
          source: 'mobile',
          entityType: 'job',
          entityId: 'M1805',
          metadata: {
            jobTitle: 'Développeur web',
            domain: 'Informatique',
          },
          occurredAt: receivedAt,
          receivedAt,
        },
        {
          eventType: 'job_viewed',
          userHash: 'user-a',
          sessionId: 'session-jobs-a',
          source: 'mobile',
          entityType: 'job',
          entityId: 'K1801',
          metadata: {
            jobTitle: 'Conseiller insertion',
            domain: 'Action sociale',
          },
          occurredAt: receivedAt,
          receivedAt,
        },
        {
          eventType: 'job_viewed',
          userHash: 'user-c',
          sessionId: 'session-jobs-c',
          source: 'mobile',
          entityType: 'job',
          entityId: 'UNKNOWN',
          metadata: {},
          occurredAt: receivedAt,
          receivedAt,
        },
        {
          eventType: 'job_swiped',
          userHash: 'user-a',
          sessionId: 'session-jobs-a',
          source: 'mobile',
          entityType: 'job',
          entityId: 'K1801',
          metadata: {
            action: 'like',
            jobTitle: 'Conseiller insertion',
            domain: 'Action sociale',
          },
          occurredAt: receivedAt,
          receivedAt,
        },
        {
          eventType: 'job_swiped',
          userHash: 'user-d',
          sessionId: 'session-jobs-d',
          source: 'mobile',
          entityType: 'job',
          entityId: 'N4101',
          metadata: {
            action: 'dislike',
            jobTitle: 'Conducteur transport',
            domain: 'Transport',
          },
          occurredAt: receivedAt,
          receivedAt,
        },
      ]);

      const jobsRes = await request(app)
        .get('/api/admin/insights/jobs')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(jobsRes.status).toBe(200);
      expect(jobsRes.body.matched).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            jobId: 'K1801',
            title: 'Conseiller insertion',
            domain: 'Action sociale',
            count: 1,
          }),
          expect.objectContaining({
            jobId: 'M1805',
            title: 'Développeur web',
            domain: 'Informatique',
            count: 1,
          }),
        ])
      );
      expect(jobsRes.body.viewed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            jobId: 'UNKNOWN',
            title: 'Métier inconnu',
            domain: 'Domaine inconnu',
          }),
        ])
      );
      expect(jobsRes.body.liked[0]).toMatchObject({
        jobId: 'K1801',
        count: 1,
      });
      expect(jobsRes.body.disliked[0]).toMatchObject({
        jobId: 'N4101',
        count: 1,
      });
      expect(jobsRes.body.domains.liked[0]).toMatchObject({
        domain: 'Action sociale',
        count: 1,
      });
      expect(jobsRes.body.recommendationInterestGap).toEqual([
        expect.objectContaining({
          jobId: 'M1805',
          title: 'Développeur web',
        }),
      ]);
    });
  });
});
