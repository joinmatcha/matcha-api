import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '@/app';
import { BilanAnswerSet } from '@/models/BilanAnswerSet';
import { BilanCompetence } from '@/models/BilanCompetence';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import PersonalityTest from '@/models/PersonalityTest';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import { RomeMetier } from '@/models/RomeMetier';
import { SupportRequest } from '@/models/SupportRequest';
import { Swipe } from '@/models/Swipe';
import { SwipeQuota } from '@/models/SwipeQuota';
import User from '@/models/User';
import { sendSupportContactEmail } from '@/services/notifications/email';

const BASE_URL = '/api/profile';

const createUserAndGetToken = async () => {
  const uniqueEmail = `test-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}@example.com`;

  const password = 'StrongPassw0rd!';

  const res = await request(app).post('/api/users').send({
    firstName: 'Test',
    lastName: 'User',
    email: uniqueEmail,
    password,
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

  return { token, password, user };
};

describe('GET /api/profile', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get(BASE_URL);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing/i);
  });

  it('should return user profile with personality null when no test exists', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .get(BASE_URL)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.personality).toBeNull();
  });

  it('should return user profile with personality data when test exists', async () => {
    const { token } = await createUserAndGetToken();

    const user = await User.findOne({ pendingEmail: { $exists: false } }).sort({
      createdAt: -1,
    });
    if (!user) throw new Error('User not found');

    const version = await PersonalityVersion.create({
      title: 'MBTI Test',
      isActive: true,
      status: 'active',
      version: '1.0',
    });

    await PersonalityQuestion.create({
      versionId: version._id,
      version: version.version,
      code: 'q1',
      text: '...',
      dimension: 'EI',
      options: [],
      order: 1,
      isActive: true,
    });

    const test = await PersonalityTest.create({
      userId: user._id,
      templateId: version._id,
      templateVersion: version.version,
      type: 'ENTP',
      result: 'Innovateur',
      traits: ['Créatif'],
      weaknesses: ['Impulsif'],
    });

    user.personalityTestId = test._id as any;
    await user.save();

    const res = await request(app)
      .get(BASE_URL)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.personality).not.toBeNull();
    expect(res.body.user.personality.type).toBe('ENTP');
    expect(res.body.user.personality.label).toBe('Innovateur');
  });
});

describe('PATCH /api/profile', () => {
  it('should update user profile successfully', async () => {
    const { token } = await createUserAndGetToken();

    const payload = {
      birthYear: 1990,
      gender: 'male',
      jobTypes: ['frontend', 'backend'],
      locationPref: 'remote',
      remote: true,
      addressCity: 'Paris',
    };

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated');
    expect(res.body.user.gender).toBe('male');
    expect(res.body.user.addressCity).toBe('Paris');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).patch(BASE_URL).send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing/i);
  });

  it('should reject invalid gender value', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(res.body.errors.some((e: any) => e.path?.includes('gender'))).toBe(
      true
    );
  });

  it('should reject invalid postal code', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ addressPostalCode: '75A0' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(
      res.body.errors.some((e: any) => e.path?.includes('addressPostalCode'))
    ).toBe(true);
  });

  it('should reject invalid coordinates', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: {
          type: 'Point',
          coordinates: ['not', 'valid'], // invalid type
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(
      res.body.errors.some(
        (e: any) =>
          e.path?.includes('location') || e.path?.includes('coordinates')
      )
    ).toBe(true);
  });

  it('should reject empty payload', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(
      res.body.errors.some((e: any) =>
        e.message?.includes('At least one field must be provided')
      )
    ).toBe(true);
  });

  it('should reject email in PATCH /profile', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .patch(BASE_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'newemail@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(
      res.body.errors.some((e: any) =>
        e.message?.toLowerCase().includes('unrecognized')
      )
    ).toBe(true);
  });
});

describe('DELETE /api/profile/account', () => {
  it('should delete the user account and related data', async () => {
    const { token } = await createUserAndGetToken();

    const userBefore = await User.findOne({});
    expect(userBefore).not.toBeNull();
    const userId = userBefore!._id;

    const job = await RomeMetier.create({
      code: `M${Date.now()}`,
      label: 'Développeur web',
      normalizedLabel: 'developpeur web',
      isActive: true,
      riasec: { codes: ['I'] },
    });

    await Promise.all([
      Swipe.create({
        userId,
        jobId: job._id,
        action: 'like',
        dayKey: '2026-06-05',
      }),
      SwipeQuota.create({
        userId,
        dayKey: '2026-06-05',
        count: 1,
      }),
      BilanAnswerSet.create({
        user: userId,
        version: 1,
        answers: [{ questionCode: 'C1', valueNumber: 4 }],
      }),
      BilanCompetence.create({
        user: userId,
        version: 1,
        rawAnswers: [{ questionCode: 'C1', valueNumber: 4 }],
        scores: {
          competence: {},
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
            id: 'test',
            title: 'Profil test',
            subtitle: 'Sous-titre',
            description: 'Description',
          },
          profileSummary: 'Résumé',
          keyStrengths: [],
          improvementAxes: [],
          recommendedSectors: [],
          actionPlan: [],
        },
      }),
    ]);

    const res = await request(app)
      .delete(`${BASE_URL}/account`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const userAfter = await User.findById(userId);
    expect(userAfter).toBeNull();
    await expect(Swipe.countDocuments({ userId })).resolves.toBe(0);
    await expect(SwipeQuota.countDocuments({ userId })).resolves.toBe(0);
    await expect(BilanAnswerSet.countDocuments({ user: userId })).resolves.toBe(
      0
    );
    await expect(
      BilanCompetence.countDocuments({ user: userId })
    ).resolves.toBe(0);
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).delete(`${BASE_URL}/account`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing/i);
  });
});

describe('POST /api/profile/change-password', () => {
  it('should change the password successfully when inputs are valid', async () => {
    const { token, password } = await createUserAndGetToken();

    const payload = {
      oldPassword: password,
      newPassword: 'NewPassw0rd!',
      confirmNewPassword: 'NewPassw0rd!',
    };

    const res = await request(app)
      .post(`${BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password updated/i);
  });

  it('should return 400 if old password is incorrect', async () => {
    const { token } = await createUserAndGetToken();

    const payload = {
      oldPassword: 'WrongOldPass!',
      newPassword: 'AnotherPassw0rd!',
      confirmNewPassword: 'AnotherPassw0rd!',
    };

    const res = await request(app)
      .post(`${BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/old password is incorrect/i);
  });

  it('should return 400 if new password is the same as the current one', async () => {
    const { token, password } = await createUserAndGetToken();

    const payload = {
      oldPassword: password,
      newPassword: password,
      confirmNewPassword: password,
    };

    const res = await request(app)
      .post(`${BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/different from the current password/i);
  });

  it('should return 400 if new passwords do not match', async () => {
    const { token, password } = await createUserAndGetToken();

    const payload = {
      oldPassword: password,
      newPassword: 'NewPass123!',
      confirmNewPassword: 'MismatchPass123!',
    };

    const res = await request(app)
      .post(`${BASE_URL}/change-password`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not match/i);
  });

  it('should return 401 if no token is provided', async () => {
    const payload = {
      oldPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
      confirmNewPassword: 'NewPass123!',
    };

    const res = await request(app)
      .post(`${BASE_URL}/change-password`)
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing/i);
  });
});

describe('POST /api/profile/request-email-change', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post(`${BASE_URL}/request-email-change`)
      .send({ newEmail: 'new@mail.com' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing|invalid/i);
  });

  it('should reject invalid email format', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .post(`${BASE_URL}/request-email-change`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    expect(res.body.errors.some((e: any) => e.path?.includes('newEmail'))).toBe(
      true
    );
  });

  it('should reject email already in use', async () => {
    const { token } = await createUserAndGetToken();

    await User.create({
      firstName: 'Dup',
      lastName: 'Licate',
      email: 'already@used.com',
      passwordHash: 'hash',
      consentAccepted: true,
      isEmailVerified: true,
    });

    const res = await request(app)
      .post(`${BASE_URL}/request-email-change`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail: 'already@used.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  it('should store pendingEmail + token when request is valid', async () => {
    const { token } = await createUserAndGetToken();

    const newEmail = 'update-me@example.com';

    await request(app)
      .post(`${BASE_URL}/request-email-change`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newEmail });

    const updated = await User.findOne({ pendingEmail: newEmail });

    expect(updated).not.toBeNull();
    expect(updated!.emailVerificationToken).toBeTruthy();
    expect(updated!.emailVerificationTokenExpires).toBeInstanceOf(Date);
  });
});

describe('POST /api/profile/support-contact', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).post(`${BASE_URL}/support-contact`).send({
      category: 'account',
      subject: 'Question sur mon compte',
      message: 'Bonjour, je souhaite avoir de l’aide sur mon compte Matcha.',
    });

    expect(res.status).toBe(401);
  });

  it('should reject invalid payload', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .post(`${BASE_URL}/support-contact`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'unknown',
        subject: 'A',
        message: 'Trop court',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create a support request and send a support contact email', async () => {
    const { token, user } = await createUserAndGetToken();

    const res = await request(app)
      .post(`${BASE_URL}/support-contact`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'privacy',
        subject: 'Question RGPD',
        message:
          'Bonjour, je souhaite obtenir des informations sur mes données personnelles.',
      });

    expect(res.status).toBe(201);
    expect(res.body.requestId).toBeTruthy();

    const supportRequest = await SupportRequest.findById(res.body.requestId);
    expect(supportRequest).not.toBeNull();
    expect(supportRequest).toMatchObject({
      email: user.email,
      category: 'privacy',
      subject: 'Question RGPD',
      status: 'open',
    });

    expect(sendSupportContactEmail).toHaveBeenCalledWith({
      fromEmail: user.email,
      fromName: `${user.firstName} ${user.lastName}`,
      requestId: res.body.requestId,
      category: 'privacy',
      subject: 'Question RGPD',
      message:
        'Bonjour, je souhaite obtenir des informations sur mes données personnelles.',
    });
  });
});
