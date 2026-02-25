import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import PersonalityTemplate from '@/models/PersonalityTemplate';
import PersonalityTest from '@/models/PersonalityTest';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const authHeader = () => {
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString() },
    JWT_SECRET,
  );
  return { Authorization: `Bearer ${token}` };
};

describe('Personality API', () => {
  beforeEach(async () => {
    await PersonalityTemplate.deleteMany({});
    await PersonalityTest.deleteMany({});
  });

  describe('GET /api/personality/active', () => {
    it('should return the active test', async () => {
      await PersonalityTemplate.create({
        title: 'MBTI Test',
        summary: 'Découvre ton type',
        isActive: true,
        version: '1.0',
        questions: [{ id: 'q1', text: '...', dimension: 'EI' }],
        profiles: [],
      });

      const res = await request(app)
        .get('/api/personality/active')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
      expect(res.body.test).toBeDefined();
      expect(res.body.test.title).toBe('MBTI Test');
      expect(Array.isArray(res.body.test.questions)).toBe(true);
    });

    it('should return 404 if no active test found', async () => {
      const res = await request(app)
        .get('/api/personality/active')
        .set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/personality/reset', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/api/personality/reset');

      expect(res.status).toBe(401);
    });

    it('should be idempotent when user has no test', async () => {
      const user = await User.create({
        email: `reset-notest-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        consentAccepted: true,
      });

      const token = jwt.sign({ id: user._id }, JWT_SECRET);

      const res = await request(app)
        .post('/api/personality/reset')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Personality test reset');
    });

    it('should delete the personality test and clear personalityTestId on user', async () => {
      const user = await User.create({
        email: `reset-withtest-${Date.now()}@example.com`,
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        consentAccepted: true,
      });

      const template = await PersonalityTemplate.create({
        title: 'MBTI Test',
        isActive: true,
        version: '1.0',
        questions: [{ id: 'q1', text: '...', dimension: 'EI' }],
        profiles: [],
      });

      const test = await PersonalityTest.create({
        userId: user._id,
        templateId: template._id,
        templateVersion: '1.0',
        type: 'ENTP',
        result: 'Innovateur',
      });

      user.personalityTestId = test._id as any;
      await user.save();

      const token = jwt.sign({ id: user._id }, JWT_SECRET);

      const res = await request(app)
        .post('/api/personality/reset')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const deletedTest = await PersonalityTest.findById(test._id);
      expect(deletedTest).toBeNull();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.personalityTestId).toBeUndefined();
    });
  });

  describe('POST /api/personality/submit', () => {
    beforeEach(async () => {
      await PersonalityTemplate.create({
        title: 'Test MBTI',
        isActive: true,
        version: '1.0',
        questions: [
          { id: 'q1', text: '...', dimension: 'EI' },
          { id: 'q2', text: '...', dimension: 'SN' },
          { id: 'q3', text: '...', dimension: 'TF' },
          { id: 'q4', text: '...', dimension: 'JP' },
        ],
        profiles: [
          {
            key: 'ESTJ',
            label: 'Leader pragmatique',
            description: 'Efficace et orienté résultats',
            strengths: ['Leadership'],
            weaknesses: ['Rigidité'],
            recommendedJobs: ['Manager'],
          },
        ],
      });
    });

    it('should compute and save the personality test', async () => {
      const answers = [
        { questionId: 'q1', value: 2 },
        { questionId: 'q2', value: 1 },
        { questionId: 'q3', value: 2 },
        { questionId: 'q4', value: 1 },
      ];

      const res = await request(app)
        .post('/api/personality/submit')
        .set(authHeader())
        .send({ answers });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBeDefined();
      expect(typeof res.body.data.label).toBe('string');
      expect(res.body.data.label.length).toBeGreaterThan(0);

      const saved = await PersonalityTest.findOne({
        _id: res.body.data.testId,
      });
      expect(saved).not.toBeNull();
      expect(saved?.type).toBe(res.body.data.type);
    });

    it('should return 400 if answers are missing', async () => {
      const res = await request(app)
        .post('/api/personality/submit')
        .set(authHeader())
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
