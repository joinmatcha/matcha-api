import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { Job } from '@/models/Job';
import { Swipe } from '@/models/Swipe';
import User from '@/models/User';

const hashToken = (rawToken: string): string =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

const createUserAndGetToken = async () => {
  const email = `prefs-test-${Date.now()}@example.com`;

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

describe('POST /api/users', () => {
  const basePayload = {
    email: 'alice@example.com',
    password: 'SuperPassword1!',
    firstName: 'Alice',
    lastName: 'Test',
    consentAccepted: true,
  };

  it('should create a user successfully', async () => {
    const res = await request(app).post('/api/users').send(basePayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty(
      'message',
      'User created successfully. Please check your email to verify your account.',
    );
    expect(res.body).toHaveProperty('userId');

    const userInDB = await User.findOne({ email: basePayload.email });
    expect(userInDB).not.toBeNull();
  });

  it('should not create a user with missing required fields', async () => {
    const { ...incompletePayload } = basePayload;
    delete (incompletePayload as { email?: string }).email;

    const res = await request(app).post('/api/users').send(incompletePayload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.some((e: any) => e.path === 'email')).toBe(true);
  });

  it('should not allow duplicate email', async () => {
    await request(app).post('/api/users').send(basePayload);

    const res = await request(app).post('/api/users').send(basePayload);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('User with this email already exists');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        ...basePayload,
        email: 'notanemail',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e: any) => e.path === 'email')).toBe(true);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        ...basePayload,
        password: '123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e: any) => e.path === 'password')).toBe(true);
  });
});

describe('GET /api/users/:id', () => {
  let userId: string;
  let token: string;
  let otherUserId: string;

  beforeEach(async () => {
    const { user, token: authToken } = await createUserAndGetToken();
    userId = user._id.toString();
    token = authToken;

    const otherUser = await User.create({
      email: `other-${Date.now()}@example.com`,
      passwordHash: 'hashed_password',
      firstName: 'Other',
      lastName: 'User',
      consentAccepted: true,
      isEmailVerified: true,
    });
    otherUserId = otherUser._id.toString();
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.status).toBe(401);
  });

  it('should return the authenticated user when given own id', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', userId);
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('emailVerificationToken');
    expect(res.body).not.toHaveProperty('resetPasswordTokenHash');
  });

  it('should return 403 when requesting another user id', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUserId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Forbidden');
  });

  it('should return 404 when user does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const tokenForMissingUser = jwt.sign(
      { id: nonExistentId.toString() },
      process.env.JWT_SECRET || 'test-secret',
    );

    const res = await request(app)
      .get(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${tokenForMissingUser}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'User not found');
  });

  it('should return 400 for invalid MongoDB ID', async () => {
    const res = await request(app)
      .get('/api/users/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid user ID');
  });
});

describe('GET /api/users/me', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
  });

  it('should return the authenticated user profile', async () => {
    const { user, token } = await createUserAndGetToken();

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', user._id.toString());
    expect(res.body).toHaveProperty('email', user.email);
    expect(res.body).not.toHaveProperty('passwordHash');
  });
});

describe('GET /api/users/me/preferences', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/users/me/preferences');

    expect(res.status).toBe(401);
  });

  it('should return empty preferences when user has no swipes', async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .get('/api/users/me/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.preferences.totalLikes).toBe(0);
    expect(res.body.preferences.totalDislikes).toBe(0);
    expect(res.body.preferences.topSectors).toHaveLength(0);
    expect(res.body.preferences.recentLikes).toHaveLength(0);
  });

  it('should return computed preferences based on swipe history', async () => {
    const { user, token } = await createUserAndGetToken();

    const job = await Job.create({
      title: 'Développeur·se web',
      isActive: true,
      growthOutlook: 'stable',
      sector: 'Tech',
      competences: ['analysis'],
      tags: ['web'],
      workConditions: ['remote'],
    });

    await Swipe.create({
      userId: user._id,
      jobId: job._id,
      action: 'like',
      swipedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/users/me/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.preferences.totalLikes).toBe(1);
    expect(res.body.preferences.totalDislikes).toBe(0);
    expect(res.body.preferences.topSectors[0].key).toBe('Tech');
    expect(res.body.preferences.recentLikes[0].title).toBe(
      'Développeur·se web',
    );
  });

  it('should count dislikes separately from likes', async () => {
    const { user, token } = await createUserAndGetToken();

    const job = await Job.create({
      title: 'Designer UX',
      isActive: true,
      growthOutlook: 'stable',
      sector: 'Design',
    });

    await Swipe.create({
      userId: user._id,
      jobId: job._id,
      action: 'dislike',
      swipedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/users/me/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.preferences.totalLikes).toBe(0);
    expect(res.body.preferences.totalDislikes).toBe(1);
    expect(res.body.preferences.recentLikes).toHaveLength(0);
  });
});

describe('GET /api/users/verify-email', () => {
  it('should replace email with pendingEmail when token is valid', async () => {
    const token = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email: 'original@example.com',
      passwordHash: 'hashed',
      consentAccepted: true,
      isEmailVerified: true,
      pendingEmail: 'updated@example.com',
      emailVerificationToken: hashToken(token),
      emailVerificationTokenExpires: new Date(Date.now() + 3600 * 1000),
    });

    const res = await request(app)
      .get(`/api/users/verify-email?token=${token}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('Email vérifié');

    const updated = await User.findById(user._id);

    expect(updated?.email).toBe('updated@example.com');
    expect(updated?.pendingEmail).toBeUndefined();
    expect(updated?.emailVerificationToken).toBeUndefined();
    expect(updated?.emailVerificationTokenExpires).toBeUndefined();
  });

  it('should return 404 if pendingEmail does not exist (signup flow only)', async () => {
    const token = crypto.randomBytes(32).toString('hex');

    await User.create({
      email: 'signup@example.com',
      passwordHash: 'hashed',
      consentAccepted: true,
      isEmailVerified: false,
      emailVerificationToken: hashToken(token),
      emailVerificationTokenExpires: new Date(Date.now() + 3600 * 1000),
    });

    const res = await request(app).get(
      `/api/users/verify-email?token=${token}`,
    );

    expect(res.status).toBe(200);
    expect(res.text).toContain('Email vérifié');
  });

  it('should return 404 when token is expired for email change', async () => {
    const token = crypto.randomBytes(32).toString('hex');

    await User.create({
      email: 'original@example.com',
      pendingEmail: 'updated@example.com',
      passwordHash: 'hashed',
      consentAccepted: true,
      isEmailVerified: true,
      emailVerificationToken: hashToken(token),
      emailVerificationTokenExpires: new Date(Date.now() - 3600 * 1000), // expired
    });

    const res = await request(app).get(
      `/api/users/verify-email?token=${token}`,
    );

    expect(res.status).toBe(404);
    expect(res.text).toContain('Token expiré');
  });
});
