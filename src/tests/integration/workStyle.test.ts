import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '@/app';
import User from '@/models/User';
import { WorkStyleQuestion } from '@/models/WorkStyleQuestion';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { WorkStyleVersion } from '@/models/WorkStyleVersion';
import { workStyleProfiles } from '@/seeds/workStyleSeed';

const createUserAndToken = async () => {
  const res = await request(app)
    .post('/api/users')
    .send({
      firstName: 'Style',
      lastName: 'User',
      email: `style-${Date.now()}-${Math.random()}@example.com`,
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

const createActiveWorkStyle = async () => {
  const version = await WorkStyleVersion.create({
    version: 1,
    title: 'Style professionnel V1',
    status: 'active',
    isActive: true,
    profiles: workStyleProfiles,
  });

  await WorkStyleQuestion.insertMany([
    {
      versionId: version._id,
      version: 1,
      code: 'AUT_1',
      text: 'Autonomie',
      dimension: 'autonomy',
      order: 1,
      polarity: 1,
    },
    {
      versionId: version._id,
      version: 1,
      code: 'STR_1',
      text: 'Structure',
      dimension: 'structure',
      order: 2,
      polarity: 1,
    },
  ]);

  return version;
};

describe('Work style API', () => {
  it('returns the active test and submits a result with history', async () => {
    const { user, token } = await createUserAndToken();
    await createActiveWorkStyle();

    const activeRes = await request(app)
      .get('/api/work-style/active')
      .set('Authorization', `Bearer ${token}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.completed).toBe(false);
    expect(activeRes.body.test.questions).toHaveLength(2);

    const submitRes = await request(app)
      .post('/api/work-style/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'AUT_1', value: 5 },
          { questionId: 'STR_1', value: 5 },
        ],
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.result.profile.title).toBeTruthy();
    expect(submitRes.body.result.scores.autonomy).toBe(100);

    const saved = await WorkStyleResult.findOne({ user: user._id });
    expect(saved).not.toBeNull();

    const meRes = await request(app)
      .get('/api/work-style/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.latestResult.id).toBe(submitRes.body.result.id);
    expect(meRes.body.history).toHaveLength(1);
  });

  it('rejects submit when an active question is missing', async () => {
    const { token } = await createUserAndToken();
    await createActiveWorkStyle();

    const res = await request(app)
      .post('/api/work-style/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [{ questionId: 'AUT_1', value: 5 }] });

    expect(res.status).toBe(400);
  });

  it('resets the previous result before retaking the test', async () => {
    const { user, token } = await createUserAndToken();
    await createActiveWorkStyle();

    const submitRes = await request(app)
      .post('/api/work-style/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          { questionId: 'AUT_1', value: 5 },
          { questionId: 'STR_1', value: 5 },
        ],
      });

    expect(submitRes.status).toBe(201);

    const resetRes = await request(app)
      .post('/api/work-style/reset')
      .set('Authorization', `Bearer ${token}`);

    expect(resetRes.status).toBe(200);
    await expect(
      WorkStyleResult.findOne({ user: user._id })
    ).resolves.toBeNull();

    const updatedUser = await User.findById(user._id).lean();
    expect(updatedUser?.workStyleResultId).toBeUndefined();

    const meRes = await request(app)
      .get('/api/work-style/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.latestResult).toBeNull();
    expect(meRes.body.history).toHaveLength(0);
  });
});
