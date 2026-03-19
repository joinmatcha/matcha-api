import mongoose from 'mongoose';

import { Job } from '@/models/Job';
import { findRecommendedJobs } from '@/services/jobMatching';

describe('findRecommendedJobs', () => {
  beforeEach(async () => {
    await Job.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('returns only relevant jobs above the score threshold', async () => {
    await Job.insertMany([
      {
        title: 'Développeur·se web',
        isActive: true,
        sector: 'Tech',
        riasec: ['RIASEC_I'],
        competences: ['analysis', 'digital'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        growthOutlook: 'growing',
      },
      {
        title: 'Job peu pertinent',
        isActive: true,
        sector: 'Autre',
        riasec: ['RIASEC_R'],
        competences: [],
        softSkills: [],
        values: [],
        workConditions: [],
        growthOutlook: 'stable',
      },
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
    await Job.insertMany([
      {
        title: 'Job moyen',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: [],
        values: [],
        workConditions: [],
        growthOutlook: 'stable',
      },
      {
        title: 'Job fort',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis', 'digital'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        growthOutlook: 'growing',
      },
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
    await Job.insertMany(
      Array.from({ length: 10 }).map((_, i) => ({
        title: `Job ${i}`,
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        growthOutlook: 'unknown',
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
    await Job.insertMany([
      {
        title: 'Job inactif',
        isActive: false,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        growthOutlook: 'unknown',
      },
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
