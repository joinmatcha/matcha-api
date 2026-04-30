import mongoose from 'mongoose';

import { RomeMetier } from '@/models/RomeMetier';
import { findRecommendedJobs } from '@/services/jobs/matching';
import { buildRomeMetier } from '@/tests/helpers/rome';

describe('findRecommendedJobs', () => {
  beforeEach(async () => {
    await RomeMetier.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('returns only relevant jobs above the score threshold', async () => {
    await RomeMetier.insertMany([
      buildRomeMetier({
        code: 'M1805',
        label: 'Développeur·se web',
        domain: { label: 'Tech' },
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }, { label: 'digital' }],
        workContexts: [{ label: 'remote' }],
      }),
      buildRomeMetier({
        code: 'X0001',
        label: 'Job peu pertinent',
        domain: { label: 'Autre' },
        riasec: { major: 'R', codes: ['RIASEC_R'] },
        skills: [],
        workContexts: [],
      }),
    ]);

    const input = {
      interestsProfile: ['RIASEC_I'],
      competenceStrengths: ['analysis'],
      softSkillStrengths: ['autonomy'],
      topValues: ['learning'],
      topWorkConditions: ['remote'],
    };

    const result = await findRecommendedJobs(input);

    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Développeur·se web');
    expect(result[0].score).toBeGreaterThanOrEqual(60);
  });

  it('returns jobs sorted by score descending', async () => {
    await RomeMetier.insertMany([
      buildRomeMetier({
        code: 'M0001',
        label: 'Job moyen',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }],
        workContexts: [],
      }),
      buildRomeMetier({
        code: 'M0002',
        label: 'Job fort',
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }, { label: 'digital' }],
        workContexts: [{ label: 'remote' }],
      }),
    ]);

    const input = {
      interestsProfile: ['RIASEC_I'],
      competenceStrengths: ['analysis', 'digital'],
      softSkillStrengths: ['autonomy'],
      topValues: ['learning'],
      topWorkConditions: ['remote'],
    };

    const result = await findRecommendedJobs(input);

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });

  it('respects the limit parameter', async () => {
    await RomeMetier.insertMany(
      Array.from({ length: 10 }).map((_, i) => ({
        ...buildRomeMetier({
          code: `L${i}`,
          label: `Job ${i}`,
          riasec: { major: 'I', codes: ['RIASEC_I'] },
          skills: [{ label: 'analysis' }],
        }),
      }))
    );

    const input = {
      interestsProfile: ['RIASEC_I'],
      competenceStrengths: ['analysis'],
      softSkillStrengths: [],
      topValues: [],
      topWorkConditions: [],
    };

    const result = await findRecommendedJobs(input, 3);

    expect(result.length).toBe(3);
  });

  it('ignores inactive jobs', async () => {
    await RomeMetier.insertMany([
      buildRomeMetier({
        code: 'INACTIF',
        label: 'Job inactif',
        isActive: false,
        riasec: { major: 'I', codes: ['RIASEC_I'] },
        skills: [{ label: 'analysis' }],
      }),
    ]);

    const input = {
      interestsProfile: ['RIASEC_I'],
      competenceStrengths: ['analysis'],
      softSkillStrengths: [],
      topValues: [],
      topWorkConditions: [],
    };

    const result = await findRecommendedJobs(input);

    expect(result.length).toBe(0);
  });
});
