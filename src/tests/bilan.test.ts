import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanAnswerSet } from '@/models/BilanAnswerSet';
import { BilanCompetence } from '@/models/BilanCompetence';
import { BilanQuestion } from '@/models/BilanQuestion';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const authHeader = (id?: string) => {
  const token = jwt.sign(
    { id: id || new mongoose.Types.ObjectId().toString() },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
};

describe('Bilan API', () => {
  beforeEach(async () => {
    await BilanQuestion.deleteMany({});
    await BilanAnswerSet.deleteMany({});
    await BilanCompetence.deleteMany({});
  });

  describe('GET /api/bilan/questions', () => {
    it('should return latest version questions', async () => {
      await BilanQuestion.create([
        {
          code: 'C1',
          domain: 'competence',
          subdomain: 'analysis',
          question: 'Test question 1',
          type: 'likert_1_5',
          version: 1,
          isActive: true,
        },
        {
          code: 'SS1',
          domain: 'soft_skill',
          subdomain: 'stress',
          question: 'Test question 2',
          type: 'likert_1_5',
          version: 1,
          isActive: true,
        },
      ]);

      const res = await request(app)
        .get('/api/bilan/questions')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBe(2);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/bilan/questions');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bilan/answers', () => {
    beforeEach(async () => {
      await BilanQuestion.create({
        code: 'C1',
        domain: 'competence',
        subdomain: 'analysis',
        question: 'Analyse correctement',
        type: 'likert_1_5',
        version: 1,
        isActive: true,
      });
    });

    it('should save answer set for authenticated user', async () => {
      const userId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/bilan/answers')
        .set(authHeader(userId))
        .send({
          version: 1,
          answers: [{ questionCode: 'C1', valueNumber: 5 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.answerSet).toBeDefined();

      const inDb = await BilanAnswerSet.findOne({ user: userId });
      expect(inDb).not.toBeNull();
      expect(inDb!.answers[0].questionCode).toBe('C1');
    });

    it('should return 400 if missing answers', async () => {
      const res = await request(app)
        .post('/api/bilan/answers')
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 if user not authenticated', async () => {
      const res = await request(app).post('/api/bilan/answers').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/bilan/generate', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(async () => {
      await BilanQuestion.create({
        code: 'C1',
        domain: 'competence',
        subdomain: 'analysis',
        question: 'Analyse correctement',
        type: 'likert_1_5',
        version: 1,
        isActive: true,
      });

      await BilanAnswerSet.create({
        user: userId,
        version: 1,
        answers: [{ questionCode: 'C1', valueNumber: 4 }],
      });
    });

    it('should compute bilan for user', async () => {
      const res = await request(app)
        .post('/api/bilan/generate')
        .set(authHeader(userId))
        .send({ version: 1 });

      expect(res.status).toBe(200);
      expect(res.body.bilan).toBeDefined();

      expect(res.body.bilan.scores.competence.analysis).toBe(4);

      expect(res.body.bilan.conclusion).toBeDefined();
      expect(res.body.bilan.conclusion.archetype).toBeDefined();
      expect(res.body.bilan.conclusion.archetype.title).toBeDefined();

      expect(Array.isArray(res.body.bilan.conclusion.recommendedJobs)).toBe(
        true,
      );

      const stored = await BilanCompetence.findOne({ user: userId });
      expect(stored).not.toBeNull();
      expect(stored!.scores.competence.analysis).toBe(4);
    });

    it('should return 400 if no answerSet exists', async () => {
      const anotherUser = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/bilan/generate')
        .set(authHeader(anotherUser))
        .send({ version: 1 });

      expect(res.status).toBe(400);
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/bilan/generate')
        .send({ version: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/bilan/me', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(async () => {
      await BilanCompetence.create({
        user: userId,
        version: 1,
        rawAnswers: [],
        scores: {
          competence: { analysis: 4 },
          soft_skill: {},
          value: {},
          work_condition: {},
          interest: {},
        },
        investigation: {
          competence: { strengths: [], acquired: [], toImprove: [] },
          softSkills: { strengths: [], acquired: [], toImprove: [] },
          topValues: [],
          topWorkConditions: [],
          interestsProfile: [],
        },
        conclusion: {
          archetype: {
            id: 'balanced_profile',
            title: 'Profil polyvalent',
            subtitle: 'Capacité d’adaptation',
            description: 'Profil de test',
          },
          profileSummary: 'Résumé test',
          keyStrengths: [],
          improvementAxes: [],
          recommendedEnvironments: [],
          recommendedJobs: [],
          actionPlan: [],
        },
      });
    });

    it('should return the latest bilan for authenticated user', async () => {
      const res = await request(app)
        .get('/api/bilan/me')
        .set(authHeader(userId));

      expect(res.status).toBe(200);
      expect(res.body.bilan).toBeDefined();
      expect(res.body.bilan.conclusion).toBeDefined();
      expect(res.body.bilan.conclusion.archetype).toBeDefined();
      expect(Array.isArray(res.body.bilan.conclusion.keyStrengths)).toBe(true);
    });

    it('should return 404 if no bilan found', async () => {
      const res = await request(app).get('/api/bilan/me').set(authHeader());
      expect(res.status).toBe(404);
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/bilan/me');
      expect(res.status).toBe(401);
    });
  });
});
