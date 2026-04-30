import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import User from '@/models/User';

const createAdmin = async () => {
  const password = 'StrongPassw0rd!';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await User.create({
    email: `admin-${Date.now()}@example.com`,
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    consentAccepted: true,
    isEmailVerified: true,
    role: 'admin',
  });

  return { admin, password };
};

const createRegularUserAndToken = async () => {
  const password = 'StrongPassw0rd!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash,
    firstName: 'Regular',
    lastName: 'User',
    consentAccepted: true,
    isEmailVerified: true,
    role: 'user',
  });

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret'
  );

  return { user, token, password };
};

describe('Admin routes', () => {
  describe('POST /api/admin/auth/login', () => {
    it('should reject invalid credentials and unverified admins', async () => {
      const password = 'StrongPassw0rd!';
      const passwordHash = await bcrypt.hash(password, 10);

      const unverifiedAdmin = await User.create({
        email: `admin-unverified-${Date.now()}@example.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Pending',
        consentAccepted: true,
        isEmailVerified: false,
        role: 'admin',
      });

      const invalidPasswordRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: unverifiedAdmin.email,
          password: 'WrongPassw0rd!',
        });

      expect(invalidPasswordRes.status).toBe(401);
      expect(invalidPasswordRes.body).toHaveProperty(
        'message',
        'Invalid credentials'
      );

      const unverifiedRes = await request(app)
        .post('/api/admin/auth/login')
        .send({
          email: unverifiedAdmin.email,
          password,
        });

      expect(unverifiedRes.status).toBe(403);
      expect(unverifiedRes.body).toHaveProperty(
        'message',
        'Please verify your email address before logging in.'
      );
    });

    it('should reject non-admin users', async () => {
      const password = 'StrongPassw0rd!';
      const passwordHash = await bcrypt.hash(password, 10);
      const email = `user-${Date.now()}@example.com`;

      await User.create({
        email,
        passwordHash,
        firstName: 'Regular',
        lastName: 'User',
        consentAccepted: true,
        isEmailVerified: true,
        role: 'user',
      });

      const res = await request(app).post('/api/admin/auth/login').send({
        email,
        password,
      });

      expect(res.status).toBe(403);
    });

    it('should return a token for admins', async () => {
      const { admin, password } = await createAdmin();

      const res = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role', 'admin');
    });
  });

  describe('Admin protected resources', () => {
    it('should return 401 without token on protected admin routes', async () => {
      const res = await request(app).get('/api/admin/users');

      expect(res.status).toBe(401);
    });

    it('should return 403 for a non-admin token on protected admin routes', async () => {
      const { token } = await createRegularUserAndToken();

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('message', 'Admin access required');
    });

    it('should list users for an authenticated admin', async () => {
      const { admin, password } = await createAdmin();

      await User.create({
        email: `member-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('AnotherPassw0rd!', 10),
        firstName: 'Member',
        lastName: 'User',
        consentAccepted: true,
        isEmailVerified: true,
      });

      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body.items[0]).not.toHaveProperty('passwordHash');
    });

    it('should filter and paginate users for admin listings', async () => {
      const { admin, password } = await createAdmin();

      await User.create([
        {
          email: `member1-${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash('AnotherPassw0rd!', 10),
          firstName: 'Member',
          lastName: 'One',
          consentAccepted: true,
          isEmailVerified: true,
          role: 'user',
        },
        {
          email: `member2-${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash('AnotherPassw0rd!', 10),
          firstName: 'Member',
          lastName: 'Two',
          consentAccepted: true,
          isEmailVerified: true,
          role: 'user',
        },
      ]);

      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });

      const res = await request(app)
        .get('/api/admin/users?role=user&limit=1&page=1&q=Member')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
    });

    it('should validate admin user updates and reject empty bodies', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });

      const res = await request(app)
        .patch(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 when updating a user with an existing email', async () => {
      const { admin, password } = await createAdmin();
      const otherUser = await User.create({
        email: `other-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('AnotherPassw0rd!', 10),
        firstName: 'Other',
        lastName: 'User',
        consentAccepted: true,
        isEmailVerified: true,
      });

      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });

      const res = await request(app)
        .patch(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .send({
          email: otherUser.email,
        });

      expect(res.status).toBe(409);
    });

    it('should filter personality versions, bilan versions, and bilan questions', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const activePersonalityVersion = await PersonalityVersion.create({
        title: 'Version Active',
        summary: 'Exposee',
        version: '1.0',
        isActive: true,
        status: 'active',
      });

      await PersonalityQuestion.create({
        versionId: activePersonalityVersion._id,
        version: activePersonalityVersion.version,
        code: 'PA1',
        text: 'Question active',
        dimension: 'EI',
        options: [{ value: 1, label: 'Oui' }],
        order: 1,
        isActive: true,
      });

      const archivedPersonalityVersion = await PersonalityVersion.create({
        title: 'Version Archivee',
        summary: 'Cachee',
        version: '2.0',
        isActive: false,
        status: 'archived',
      });

      await PersonalityQuestion.create({
        versionId: archivedPersonalityVersion._id,
        version: archivedPersonalityVersion.version,
        code: 'PA2',
        text: 'Question archivee',
        dimension: 'SN',
        options: [{ value: 2, label: 'Toujours' }],
        order: 1,
        isActive: false,
      });

      await BilanVersion.create([
        {
          version: 1,
          title: 'Bilan Active',
          description: 'Version visible',
          isActive: true,
          status: 'active',
        },
        {
          version: 2,
          title: 'Bilan Archive',
          description: 'Version archivee',
          isActive: false,
          status: 'archived',
        },
      ]);

      await BilanQuestion.create([
        {
          code: 'INT-1',
          domain: 'interest',
          question: 'Question interet active',
          type: 'likert_1_5',
          version: 1,
          isActive: true,
        },
        {
          code: 'COMP-1',
          domain: 'competence',
          question: 'Question competence archivee',
          type: 'likert_1_5',
          version: 2,
          isActive: false,
        },
      ]);

      const [personalityRes, bilanVersionsRes, bilanQuestionsRes] =
        await Promise.all([
          request(app)
            .get('/api/admin/personality-versions?isActive=true&q=Active')
            .set('Authorization', `Bearer ${token}`),
          request(app)
            .get(
              '/api/admin/bilan-versions?status=active&isActive=true&q=visible'
            )
            .set('Authorization', `Bearer ${token}`),
          request(app)
            .get(
              '/api/admin/bilan-questions?version=1&isActive=true&domain=interest&q=interet'
            )
            .set('Authorization', `Bearer ${token}`),
        ]);

      expect(personalityRes.status).toBe(200);
      expect(personalityRes.body.items).toHaveLength(1);
      expect(personalityRes.body.items[0]).toHaveProperty('version', '1.0');

      expect(bilanVersionsRes.status).toBe(200);
      expect(bilanVersionsRes.body.items).toHaveLength(1);
      expect(bilanVersionsRes.body.items[0]).toHaveProperty('version', 1);

      expect(bilanQuestionsRes.status).toBe(200);
      expect(bilanQuestionsRes.body.items).toHaveLength(1);
      expect(bilanQuestionsRes.body.items[0]).toHaveProperty('code', 'INT-1');
    });

    it('should create listable personality versions and bilan questions', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const templateRes = await request(app)
        .post('/api/admin/personality-versions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Template BO',
          version: '2.0',
          questions: [
            {
              id: 'Q1',
              text: 'Question 1',
              dimension: 'EI',
              options: [{ value: 1, label: 'Oui' }],
            },
          ],
        });

      expect(templateRes.status).toBe(201);

      await request(app)
        .post('/api/admin/bilan-versions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: 1,
          title: 'Bilan V1',
          isActive: true,
        });

      const bilanRes = await request(app)
        .post('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'ADM1',
          domain: 'interest',
          question: 'Tu aimes analyser ?',
          type: 'likert_1_5',
          version: 1,
        });

      expect(bilanRes.status).toBe(201);

      const listTemplateRes = await request(app)
        .get('/api/admin/personality-versions')
        .set('Authorization', `Bearer ${token}`);
      const listBilanRes = await request(app)
        .get('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`);

      expect(listTemplateRes.status).toBe(200);
      expect(listTemplateRes.body.items).toHaveLength(1);
      expect(listBilanRes.status).toBe(200);
      expect(listBilanRes.body.items).toHaveLength(1);

      expect(await PersonalityVersion.countDocuments()).toBe(1);
      expect(await PersonalityQuestion.countDocuments()).toBe(1);
      expect(await BilanQuestion.countDocuments()).toBe(1);
    });

    it('should duplicate a personality version, edit questions one by one, and activate the new version', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const initialTemplate = await PersonalityVersion.create({
        title: 'Template V1',
        summary: 'Version initiale',
        version: '1.0',
        isActive: true,
        status: 'active',
      });

      await PersonalityQuestion.create({
        versionId: initialTemplate._id,
        version: initialTemplate.version,
        code: 'Q1',
        text: 'Question initiale',
        dimension: 'EI',
        options: [{ value: 1, label: 'Oui' }],
        order: 1,
        isActive: true,
      });

      const duplicateRes = await request(app)
        .post(
          `/api/admin/personality-versions/${initialTemplate._id}/duplicate`
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: '2.0',
          title: 'Template V2',
        });

      expect(duplicateRes.status).toBe(201);
      expect(duplicateRes.body).toHaveProperty('version', '2.0');
      expect(duplicateRes.body).toHaveProperty('isActive', false);

      const duplicatedTemplateId = duplicateRes.body._id;

      const addQuestionRes = await request(app)
        .post(
          `/api/admin/personality-versions/${duplicatedTemplateId}/questions`
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: 'Q2',
          text: 'Nouvelle question V2',
          dimension: 'SN',
          options: [{ value: 2, label: 'Toujours' }],
        });

      expect(addQuestionRes.status).toBe(201);
      expect(addQuestionRes.body.questions).toHaveLength(2);

      const updateQuestionRes = await request(app)
        .patch(
          `/api/admin/personality-versions/${duplicatedTemplateId}/questions/Q2`
        )
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Question V2 mise a jour',
        });

      expect(updateQuestionRes.status).toBe(200);
      expect(
        updateQuestionRes.body.questions.find(
          (question: any) => question.id === 'Q2'
        )
      ).toMatchObject({
        id: 'Q2',
        text: 'Question V2 mise a jour',
      });

      const deleteQuestionRes = await request(app)
        .delete(
          `/api/admin/personality-versions/${duplicatedTemplateId}/questions/Q1`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(deleteQuestionRes.status).toBe(200);
      expect(deleteQuestionRes.body.questions).toHaveLength(1);
      expect(deleteQuestionRes.body.questions[0]).toHaveProperty('id', 'Q2');

      const activateRes = await request(app)
        .post(
          `/api/admin/personality-versions/${duplicatedTemplateId}/activate`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(activateRes.status).toBe(200);
      expect(activateRes.body).toHaveProperty('isActive', true);

      const refreshedV1 = await PersonalityVersion.findById(
        initialTemplate._id
      ).lean();
      const refreshedV2 =
        await PersonalityVersion.findById(duplicatedTemplateId).lean();

      expect(refreshedV1?.isActive).toBe(false);
      expect(refreshedV2?.isActive).toBe(true);

      const userId = new mongoose.Types.ObjectId().toString();
      const userToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'test-secret'
      );

      const activeRes = await request(app)
        .get('/api/personality/active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(activeRes.status).toBe(200);
      expect(activeRes.body.test).toHaveProperty('version', '2.0');
      expect(activeRes.body.test.questions).toHaveLength(1);
      expect(activeRes.body.test.questions[0]).toHaveProperty('id', 'Q2');

      const deactivateTemplateRes = await request(app)
        .post(
          `/api/admin/personality-versions/${duplicatedTemplateId}/deactivate`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(deactivateTemplateRes.status).toBe(200);
      expect(deactivateTemplateRes.body).toHaveProperty('isActive', false);
    });

    it('should reject duplicate template versions and duplicate question ids inside a template', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const template = await PersonalityVersion.create({
        title: 'Template source',
        summary: 'Source',
        version: '1.0',
        isActive: false,
        status: 'draft',
      });

      await PersonalityQuestion.create({
        versionId: template._id,
        version: template.version,
        code: 'Q1',
        text: 'Question 1',
        dimension: 'EI',
        options: [{ value: 1, label: 'Oui' }],
        order: 1,
        isActive: true,
      });

      const duplicateVersionRes = await request(app)
        .post(`/api/admin/personality-versions/${template._id}/duplicate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: '1.0',
        });

      expect(duplicateVersionRes.status).toBe(409);

      const duplicateQuestionIdRes = await request(app)
        .post(`/api/admin/personality-versions/${template._id}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: 'Q1',
          text: 'Question en doublon',
          dimension: 'SN',
          options: [{ value: 2, label: 'Toujours' }],
        });

      expect(duplicateQuestionIdRes.status).toBe(409);
      expect(duplicateQuestionIdRes.body).toHaveProperty(
        'message',
        'A question with this id already exists in this template'
      );
    });

    it('should validate empty admin updates and report missing personality resources', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const version = await PersonalityVersion.create({
        title: 'Version cible',
        version: '1.0',
        isActive: false,
        status: 'draft',
      });

      await PersonalityQuestion.create({
        versionId: version._id,
        version: version.version,
        code: 'Q1',
        text: 'Question source',
        dimension: 'EI',
        options: [{ value: 1, label: 'Oui' }],
        order: 1,
        isActive: false,
      });

      const emptyUpdateRes = await request(app)
        .patch(`/api/admin/personality-versions/${version._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(emptyUpdateRes.status).toBe(400);
      expect(emptyUpdateRes.body.success).toBe(false);

      const emptyQuestionUpdateRes = await request(app)
        .patch(`/api/admin/personality-versions/${version._id}/questions/Q1`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(emptyQuestionUpdateRes.status).toBe(400);
      expect(emptyQuestionUpdateRes.body.success).toBe(false);

      const missingVersionId = new mongoose.Types.ObjectId().toString();

      const [
        missingVersionUpdateRes,
        missingVersionDuplicateRes,
        missingVersionActivateRes,
        missingVersionDeactivateRes,
        missingVersionAddQuestionRes,
      ] = await Promise.all([
        request(app)
          .patch(`/api/admin/personality-versions/${missingVersionId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Introuvable' }),
        request(app)
          .post(`/api/admin/personality-versions/${missingVersionId}/duplicate`)
          .set('Authorization', `Bearer ${token}`)
          .send({ version: '2.0' }),
        request(app)
          .post(`/api/admin/personality-versions/${missingVersionId}/activate`)
          .set('Authorization', `Bearer ${token}`),
        request(app)
          .post(
            `/api/admin/personality-versions/${missingVersionId}/deactivate`
          )
          .set('Authorization', `Bearer ${token}`),
        request(app)
          .post(`/api/admin/personality-versions/${missingVersionId}/questions`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            id: 'QX',
            text: 'Question',
            dimension: 'SN',
            options: [{ value: 2, label: 'Toujours' }],
          }),
      ]);

      expect(missingVersionUpdateRes.status).toBe(404);
      expect(missingVersionDuplicateRes.status).toBe(404);
      expect(missingVersionActivateRes.status).toBe(404);
      expect(missingVersionDeactivateRes.status).toBe(404);
      expect(missingVersionAddQuestionRes.status).toBe(404);

      const missingQuestionUpdateRes = await request(app)
        .patch(
          `/api/admin/personality-versions/${version._id}/questions/UNKNOWN`
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Maj' });

      expect(missingQuestionUpdateRes.status).toBe(404);
      expect(missingQuestionUpdateRes.body).toHaveProperty(
        'message',
        'Personality question not found'
      );

      const missingQuestionDeleteRes = await request(app)
        .delete(
          `/api/admin/personality-versions/${version._id}/questions/UNKNOWN`
        )
        .set('Authorization', `Bearer ${token}`);

      expect(missingQuestionDeleteRes.status).toBe(404);
      expect(missingQuestionDeleteRes.body).toHaveProperty(
        'message',
        'Personality question not found'
      );
    });

    it('should return 409 when creating duplicate bilan question codes', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      await request(app)
        .post('/api/admin/bilan-versions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: 1,
          title: 'Bilan V1',
          isActive: true,
        });

      await request(app)
        .post('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'ADM1',
          domain: 'interest',
          question: 'Premiere question ?',
          type: 'likert_1_5',
          version: 1,
        });

      const duplicateRes = await request(app)
        .post('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'ADM1',
          domain: 'interest',
          question: 'Deuxieme question ?',
          type: 'likert_1_5',
          version: 1,
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body).toHaveProperty(
        'message',
        'A question with this code already exists'
      );
    });

    it('should manage bilan versions lifecycle and expose the active version to the app', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const createVersionRes = await request(app)
        .post('/api/admin/bilan-versions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: 1,
          title: 'Bilan V1',
          description: 'Version initiale',
          isActive: true,
        });

      expect(createVersionRes.status).toBe(201);
      expect(createVersionRes.body).toHaveProperty('status', 'active');

      const createQuestionV1Res = await request(app)
        .post('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'BV1Q1',
          domain: 'interest',
          question: 'Question v1',
          type: 'likert_1_5',
          version: 1,
        });

      expect(createQuestionV1Res.status).toBe(201);

      const duplicateVersionRes = await request(app)
        .post('/api/admin/bilan-versions/1/duplicate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          version: 2,
          title: 'Bilan V2',
        });

      expect(duplicateVersionRes.status).toBe(201);
      expect(duplicateVersionRes.body).toHaveProperty('status', 'draft');

      const duplicatedQuestion = await BilanQuestion.findOne({
        version: 2,
        code: 'BV1Q1',
      }).lean();
      expect(duplicatedQuestion).not.toBeNull();

      const activateVersionRes = await request(app)
        .post('/api/admin/bilan-versions/2/activate')
        .set('Authorization', `Bearer ${token}`);

      expect(activateVersionRes.status).toBe(200);
      expect(activateVersionRes.body).toHaveProperty('isActive', true);

      const version1 = await BilanVersion.findOne({ version: 1 }).lean();
      const version2 = await BilanVersion.findOne({ version: 2 }).lean();

      expect(version1?.isActive).toBe(false);
      expect(version2?.isActive).toBe(true);
      expect(version2?.status).toBe('active');

      const appUserToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString() },
        process.env.JWT_SECRET || 'test-secret'
      );

      const activeQuestionsRes = await request(app)
        .get('/api/bilan/questions')
        .set('Authorization', `Bearer ${appUserToken}`);

      expect(activeQuestionsRes.status).toBe(200);
      expect(activeQuestionsRes.body).toHaveProperty('version', 2);
      expect(activeQuestionsRes.body.questions).toHaveLength(1);
      expect(activeQuestionsRes.body.questions[0]).toHaveProperty(
        'code',
        'BV1Q1'
      );

      const deactivateVersionRes = await request(app)
        .post('/api/admin/bilan-versions/2/deactivate')
        .set('Authorization', `Bearer ${token}`);

      expect(deactivateVersionRes.status).toBe(200);
      expect(deactivateVersionRes.body).toHaveProperty('isActive', false);
      expect(deactivateVersionRes.body).toHaveProperty('status', 'archived');
    });

    it('should reject bilan questions on unknown versions and refuse activating a version without active questions', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      const createQuestionRes = await request(app)
        .post('/api/admin/bilan-questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'NO_VERSION',
          domain: 'interest',
          question: 'Question invalide',
          type: 'likert_1_5',
          version: 99,
        });

      expect(createQuestionRes.status).toBe(400);
      expect(createQuestionRes.body).toHaveProperty(
        'message',
        'Bilan version does not exist'
      );

      await BilanVersion.create({
        version: 3,
        title: 'Bilan V3',
        isActive: false,
        status: 'draft',
      });

      const activateRes = await request(app)
        .post('/api/admin/bilan-versions/3/activate')
        .set('Authorization', `Bearer ${token}`);

      expect(activateRes.status).toBe(400);
      expect(activateRes.body).toHaveProperty(
        'message',
        'Cannot activate a bilan version without active questions'
      );
    });

    it('should validate bilan admin updates and report missing bilan resources', async () => {
      const { admin, password } = await createAdmin();
      const loginRes = await request(app).post('/api/admin/auth/login').send({
        email: admin.email,
        password,
      });
      const token = loginRes.body.token;

      await BilanVersion.create({
        version: 1,
        title: 'Bilan cible',
        isActive: false,
        status: 'draft',
      });

      const question = await BilanQuestion.create({
        code: 'B1',
        domain: 'interest',
        question: 'Question cible',
        type: 'likert_1_5',
        version: 1,
        isActive: true,
      });

      const emptyVersionUpdateRes = await request(app)
        .patch('/api/admin/bilan-versions/1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(emptyVersionUpdateRes.status).toBe(400);
      expect(emptyVersionUpdateRes.body.success).toBe(false);

      const emptyQuestionUpdateRes = await request(app)
        .patch(`/api/admin/bilan-questions/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(emptyQuestionUpdateRes.status).toBe(400);
      expect(emptyQuestionUpdateRes.body.success).toBe(false);

      const invalidQuestionIdRes = await request(app)
        .patch('/api/admin/bilan-questions/not-an-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Maj' });

      expect(invalidQuestionIdRes.status).toBe(400);

      const [
        missingVersionUpdateRes,
        missingVersionDuplicateRes,
        missingVersionActivateRes,
        missingVersionDeactivateRes,
      ] = await Promise.all([
        request(app)
          .patch('/api/admin/bilan-versions/99')
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Introuvable' }),
        request(app)
          .post('/api/admin/bilan-versions/99/duplicate')
          .set('Authorization', `Bearer ${token}`)
          .send({ version: 100 }),
        request(app)
          .post('/api/admin/bilan-versions/99/activate')
          .set('Authorization', `Bearer ${token}`),
        request(app)
          .post('/api/admin/bilan-versions/99/deactivate')
          .set('Authorization', `Bearer ${token}`),
      ]);

      expect(missingVersionUpdateRes.status).toBe(404);
      expect(missingVersionDuplicateRes.status).toBe(404);
      expect(missingVersionActivateRes.status).toBe(404);
      expect(missingVersionDeactivateRes.status).toBe(404);

      const duplicateVersionRes = await request(app)
        .post('/api/admin/bilan-versions/1/duplicate')
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 1 });

      expect(duplicateVersionRes.status).toBe(409);
      expect(duplicateVersionRes.body).toHaveProperty(
        'message',
        'A bilan version with this version already exists'
      );

      const unknownTargetVersionRes = await request(app)
        .patch(`/api/admin/bilan-questions/${question._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ version: 88 });

      expect(unknownTargetVersionRes.status).toBe(400);
      expect(unknownTargetVersionRes.body).toHaveProperty(
        'message',
        'Bilan version does not exist'
      );

      const missingQuestionRes = await request(app)
        .patch(
          `/api/admin/bilan-questions/${new mongoose.Types.ObjectId().toString()}`
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ question: 'Introuvable' });

      expect(missingQuestionRes.status).toBe(404);
      expect(missingQuestionRes.body).toHaveProperty(
        'message',
        'Bilan question not found'
      );
    });
  });
});
