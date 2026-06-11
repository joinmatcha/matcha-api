import mongoose from 'mongoose';

import { BilanCompetence } from '@/models/BilanCompetence';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
import { compareJobsForUser } from '@/services/jobs/compare';
import { buildRomeMetier } from '@/tests/helpers/rome';

const createBilan = (userId: mongoose.Types.ObjectId) =>
  BilanCompetence.create({
    user: userId,
    version: 1,
    rawAnswers: [],
    scores: {
      competence: {},
      soft_skill: {},
      value: {},
      work_condition: {},
      interest: {},
    },
    investigation: {
      competence: { strengths: ['analysis'], acquired: [], toImprove: [] },
      softSkills: { strengths: ['autonomy'], acquired: [], toImprove: [] },
      topValues: ['learning'],
      topWorkConditions: ['remote'],
      interestsProfile: ['RIASEC_I'],
    },
    conclusion: {
      archetype: {
        id: 'investigator',
        title: 'Investigateur',
        subtitle: 'Analyse et exploration',
        description: 'Profil orienté analyse',
      },
      profileSummary: 'Résumé',
      keyStrengths: ['Analyse'],
      improvementAxes: [],
      recommendedEnvironments: [],
      recommendedJobs: [],
      actionPlan: [],
    },
  });

describe('compareJobsForUser', () => {
  beforeEach(async () => {
    await Promise.all([
      BilanCompetence.deleteMany({}),
      RomeMarketStat.deleteMany({}),
      RomeMetier.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('compares active jobs using the latest user bilan', async () => {
    const userId = new mongoose.Types.ObjectId();
    const bilan = await createBilan(userId);
    const first = await RomeMetier.create(
      buildRomeMetier({
        code: 'M1805',
        label: 'Développeur web',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [
          { label: 'analysis', isMain: true },
          { label: 'testing', isMain: true },
        ],
        workContexts: [{ label: 'remote' }],
        accessToJob: 'Formation en développement web',
      })
    );
    const second = await RomeMetier.create(
      buildRomeMetier({
        code: 'M1403',
        label: 'Data analyst',
        riasec: { major: 'I', codes: ['RIASEC_I', 'RIASEC_C'] },
        skills: [
          { label: 'analysis', isMain: true },
          { label: 'sql', isMain: true },
        ],
        workContexts: [{ label: 'hybrid' }],
      })
    );

    await RomeMarketStat.create({
      metierId: first._id,
      metierCode: first.code,
      metierLabel: first.label,
      territory: { type: 'NAT', code: 'FR', label: 'France' },
      offers: {
        label: 'Offres',
        values: [{ count: 120 }],
      },
      lastSyncedAt: new Date('2026-01-01'),
    });

    const result = await compareJobsForUser(userId.toString(), [
      second._id.toString(),
      first._id.toString(),
    ]);

    expect(result.context).toMatchObject({
      bilanId: bilan._id.toString(),
      bilanVersion: 1,
      interestsProfile: ['RIASEC_I'],
      strengths: ['Analyse', 'Autonomie'],
      workConditions: ['Télétravail'],
    });
    expect(result.jobs.map((job) => job.id)).toEqual([
      second._id.toString(),
      first._id.toString(),
    ]);
    expect(result.jobs[0]).toMatchObject({
      title: 'Data analyst',
      matchedInterests: ['RIASEC_I'],
      matchedSkills: ['analysis'],
      skillsToDevelop: ['sql'],
    });
    expect(result.jobs[1].market?.offers?.values[0].count).toBe(120);
    expect(result.jobs[1].recommendedNextStep).toContain('testing');
  });

  it('rejects duplicate job ids', async () => {
    const id = new mongoose.Types.ObjectId().toString();

    await expect(
      compareJobsForUser(new mongoose.Types.ObjectId().toString(), [id, id])
    ).rejects.toMatchObject({
      status: 400,
      message: 'Duplicate job ids are not allowed',
    });
  });

  it('requires a user bilan', async () => {
    const first = await RomeMetier.create(buildRomeMetier());
    const second = await RomeMetier.create(buildRomeMetier());

    await expect(
      compareJobsForUser(new mongoose.Types.ObjectId().toString(), [
        first._id.toString(),
        second._id.toString(),
      ])
    ).rejects.toMatchObject({
      status: 404,
      message: 'No bilan found',
    });
  });

  it('rejects inactive or unknown jobs', async () => {
    const userId = new mongoose.Types.ObjectId();
    await createBilan(userId);
    const active = await RomeMetier.create(buildRomeMetier());
    const inactive = await RomeMetier.create(
      buildRomeMetier({ isActive: false })
    );

    await expect(
      compareJobsForUser(userId.toString(), [
        active._id.toString(),
        inactive._id.toString(),
      ])
    ).rejects.toMatchObject({
      status: 404,
      message: 'One or more jobs were not found',
    });
  });
});
