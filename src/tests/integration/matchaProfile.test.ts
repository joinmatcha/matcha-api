import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '@/app';
import { BilanCompetence } from '@/models/BilanCompetence';
import PersonalityTest from '@/models/PersonalityTest';
import { RomeMetier } from '@/models/RomeMetier';
import { Swipe } from '@/models/Swipe';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { buildRomeMetier } from '@/tests/helpers/rome';

async function createUserAndToken() {
  const res = await request(app)
    .post('/api/users')
    .send({
      firstName: 'Etienne',
      lastName: 'Roche',
      email: `matcha-profile-${Date.now()}@example.com`,
      password: 'StrongPassw0rd!',
      consentAccepted: true,
    });

  const user = await User.findById(res.body.userId);
  if (!user) throw new Error('User not found');

  user.isEmailVerified = true;
  user.birthYear = 1998;
  user.addressCity = 'Paris';
  user.locationPref = 'remote';
  user.jobTypes = ['CDI'];
  await user.save();

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'test-secret'
  );

  return { user, token };
}

describe('Matcha profile routes', () => {
  beforeEach(async () => {
    await Promise.all([
      BilanCompetence.deleteMany({}),
      PersonalityTest.deleteMany({}),
      WorkStyleResult.deleteMany({}),
      RomeMetier.deleteMany({}),
      Swipe.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/matcha-profile/me', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/matcha-profile/me');

      expect(res.status).toBe(401);
    });

    it('returns a consolidated profile from tests and liked jobs', async () => {
      const { user, token } = await createUserAndToken();
      const job = await RomeMetier.create(
        buildRomeMetier({
          code: 'M1602',
          label: 'Conseiller clientèle',
          definition: 'Accompagne les clients dans leurs démarches.',
          domain: {
            code: 'D14',
            label: 'Relation client',
            grandDomain: { code: 'D', label: 'Commerce' },
          },
          skills: [{ label: 'Relation client', isMain: true }],
          workContexts: [{ label: 'Contact humain' }],
          themes: [{ label: 'Conseil' }],
          riasec: { major: 'S', codes: ['RIASEC_S'] },
        })
      );

      await BilanCompetence.create({
        user: user._id,
        version: 2,
        investigation: {
          competence: {
            strengths: ['customer', 'pedagogy'],
            acquired: [],
            toImprove: [],
          },
          softSkills: {
            strengths: ['autonomy'],
            acquired: [],
            toImprove: [],
          },
          topValues: ['meaning'],
          topWorkConditions: ['contact'],
          interestsProfile: ['RIASEC_S'],
          feasibilityProfile: [],
        },
        conclusion: {
          archetype: {
            id: 'human-catalyst',
            title: 'Le catalyseur humain',
            subtitle: 'Créer de l’impact en accompagnant les autres',
            description: 'Profil orienté relation et transmission.',
          },
          profileSummary:
            'Tu avances bien quand tu peux créer du lien et aider les autres.',
          keyStrengths: ['Relation client', 'Transmission'],
          improvementAxes: ['Priorisation'],
          recommendedSectors: ['Contact humain'],
          actionPlan: [],
        },
      });

      const personality = await PersonalityTest.create({
        userId: new mongoose.Types.ObjectId(),
        templateId: new mongoose.Types.ObjectId(),
        templateVersion: '1',
        answers: [],
        type: 'ENFJ',
        result: 'Le catalyseur humain',
        description: 'Profil relationnel.',
        traits: ['Relation client', 'Empathie'],
      });
      await User.findByIdAndUpdate(user._id, {
        personalityTestId: personality._id,
      });

      await WorkStyleResult.create({
        user: user._id,
        versionId: new mongoose.Types.ObjectId(),
        version: 1,
        answers: [],
        scores: {
          autonomy: 75,
          collaboration: 60,
          pace: 55,
          structure: 70,
          variety: 50,
          human_contact: 85,
          mobility: 30,
          learning: 65,
        },
        topAxes: ['human_contact', 'structure'],
        profile: {
          key: 'terrain-relationnel',
          title: 'Terrain relationnel',
          description: 'Tu préfères un environnement concret et humain.',
          strengths: ['Contact humain'],
          cautions: [],
          advice: [],
        },
      });

      await Swipe.create({
        userId: user._id,
        jobId: job._id,
        action: 'like',
        swipedAt: new Date(),
      });

      const res = await request(app)
        .get('/api/matcha-profile/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile).toMatchObject({
        completion: 100,
        mainProfile: {
          title: 'Le catalyseur humain',
        },
        completedTests: {
          total: 3,
          bilan: true,
          personality: true,
          workStyle: true,
        },
        nextBestAction: {
          type: 'start_matching',
          route: 'JobMatching',
        },
      });
      expect(res.body.profile.mainProfile.summary).toContain(
        'Ton profil fait surtout ressortir Relation client et Transmission'
      );
      expect(res.body.profile.strongSignals[0]).toMatchObject({
        label: 'Relation client',
      });
      expect(res.body.profile.keyDimensions.strengths).toEqual(
        expect.arrayContaining(['Relation client', 'Transmission', 'Autonomie'])
      );
      expect(res.body.profile.matchedJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Conseiller clientèle' }),
        ])
      );
      expect(res.body.profile.likedJobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Conseiller clientèle',
            likesCount: 1,
          }),
        ])
      );
    });
  });
});
