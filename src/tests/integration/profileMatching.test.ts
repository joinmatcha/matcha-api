import mongoose from 'mongoose';

import { BilanCompetence } from '@/models/BilanCompetence';
import PersonalityTest from '@/models/PersonalityTest';
import { RomeMetier } from '@/models/RomeMetier';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { buildProfileMatching } from '@/services/jobs/profileMatching';
import { buildRomeMetier } from '@/tests/helpers/rome';

async function createUser(email: string) {
  return User.create({
    firstName: 'Test',
    lastName: 'Matching',
    email,
    passwordHash: 'hash',
    consentAccepted: true,
    isEmailVerified: true,
  });
}

async function createBilan({
  userId,
  strengths,
  workConditions,
  interests,
  sectors,
}: {
  userId: mongoose.Types.ObjectId;
  strengths: string[];
  workConditions: string[];
  interests: string[];
  sectors: string[];
}) {
  await BilanCompetence.create({
    user: userId,
    version: 1,
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
      competence: { strengths, acquired: [], toImprove: [] },
      softSkills: { strengths: [], acquired: [], toImprove: [] },
      topValues: [],
      topWorkConditions: workConditions,
      interestsProfile: interests,
      feasibilityProfile: [],
    },
    conclusion: {
      archetype: {
        id: 'test',
        title: 'Profil test',
        subtitle: 'Test',
        description: 'Test',
      },
      profileSummary: 'Profil de test',
      keyStrengths: strengths,
      improvementAxes: [],
      recommendedSectors: sectors,
      actionPlan: [],
    },
  });
}

async function createPersonality({
  userId,
  type,
  traits,
  sectors,
}: {
  userId: mongoose.Types.ObjectId;
  type: string;
  traits: string[];
  sectors: string[];
}) {
  const test = await PersonalityTest.create({
    userId,
    templateId: new mongoose.Types.ObjectId(),
    templateVersion: '1',
    answers: [],
    type,
    result: 'Profil test',
    description: 'Profil test',
    traits,
    weaknesses: [],
    suggestedSectors: sectors,
    scoreBreakdown: {},
  });

  await User.findByIdAndUpdate(userId, { personalityTestId: test._id });
}

async function createWorkStyle({
  userId,
  topAxes,
  strengths,
}: {
  userId: mongoose.Types.ObjectId;
  topAxes: string[];
  strengths: string[];
}) {
  await WorkStyleResult.create({
    user: userId,
    versionId: new mongoose.Types.ObjectId(),
    version: 1,
    answers: [],
    scores: {},
    topAxes,
    profile: {
      key: 'test',
      title: 'Style test',
      description: 'Style test',
      strengths,
      cautions: [],
      advice: [],
    },
  });
}

describe('profile matching integration', () => {
  beforeEach(async () => {
    await Promise.all([
      BilanCompetence.deleteMany({}),
      PersonalityTest.deleteMany({}),
      WorkStyleResult.deleteMany({}),
      RomeMetier.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('returns different top matches for different complete profiles', async () => {
    const [digitalUser, careUser] = await Promise.all([
      createUser('digital@example.com'),
      createUser('care@example.com'),
    ]);

    await RomeMetier.insertMany([
      buildRomeMetier({
        code: 'DIGI',
        label: 'Développeur web',
        domain: { label: 'Informatique' },
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis digital', isMain: true }],
        workContexts: [{ label: 'remote autonomie apprentissage' }],
        themes: [{ label: 'innovation' }],
      }),
      buildRomeMetier({
        code: 'CARE',
        label: 'Conseiller insertion',
        domain: { label: 'Accompagnement social' },
        riasec: { major: 'S', codes: ['RIASEC_S'] },
        skills: [{ label: 'communication pédagogie relation', isMain: true }],
        workContexts: [{ label: 'contact humain conseil structure' }],
        themes: [{ label: 'accompagnement' }],
      }),
      buildRomeMetier({
        code: 'CTRL',
        label: 'Contrôleur qualité',
        domain: { label: 'Industrie' },
        riasec: { major: 'C', codes: ['RIASEC_C'] },
        skills: [{ label: 'contrôle procédure qualité', isMain: true }],
        workContexts: [{ label: 'structure contrôle' }],
        themes: [{ label: 'qualité' }],
      }),
    ]);

    await Promise.all([
      createBilan({
        userId: digitalUser._id,
        strengths: ['analysis', 'digital'],
        workConditions: ['remote', 'learning'],
        interests: ['RIASEC_I'],
        sectors: ['Informatique'],
      }),
      createPersonality({
        userId: digitalUser._id,
        type: 'INTP',
        traits: ['analysis'],
        sectors: ['Informatique'],
      }),
      createWorkStyle({
        userId: digitalUser._id,
        topAxes: ['autonomy', 'learning'],
        strengths: ['Autonomie'],
      }),
      createBilan({
        userId: careUser._id,
        strengths: ['communication', 'pédagogie'],
        workConditions: ['contact humain', 'structure'],
        interests: ['RIASEC_S'],
        sectors: ['Accompagnement social'],
      }),
      createPersonality({
        userId: careUser._id,
        type: 'ENFJ',
        traits: ['communication', 'empathie'],
        sectors: ['Accompagnement social'],
      }),
      createWorkStyle({
        userId: careUser._id,
        topAxes: ['human_contact', 'structure'],
        strengths: ['Contact humain'],
      }),
    ]);

    const [digitalMatching, careMatching] = await Promise.all([
      buildProfileMatching(digitalUser._id.toString(), {
        limit: 5,
        minScore: 10,
      }),
      buildProfileMatching(careUser._id.toString(), {
        limit: 5,
        minScore: 10,
      }),
    ]);

    expect(digitalMatching.unlocked).toBe(true);
    expect(careMatching.unlocked).toBe(true);
    expect(digitalMatching.jobs[0].title).toBe('Développeur web');
    expect(careMatching.jobs[0].title).toBe('Conseiller insertion');
    expect(digitalMatching.jobs[0].title).not.toBe(careMatching.jobs[0].title);
  });
});
