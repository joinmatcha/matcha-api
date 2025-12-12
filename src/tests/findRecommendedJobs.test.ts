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

  it('should return jobs matching multiple criteria with reasons', async () => {
    await Job.insertMany([
      {
        title: 'Développeur·se web',
        sector: 'Tech',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis', 'digital'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        description: 'Développe des applications web.',
        growthOutlook: 'growing',
      },
      {
        title: 'Coach professionnel',
        sector: 'Accompagnement',
        isActive: true,
        riasec: ['RIASEC_S'],
        competences: ['pedagogy'],
        softSkills: ['communication'],
        values: ['meaning'],
        workConditions: ['contact'],
        description: 'Accompagne des personnes.',
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

    const job = result[0];

    expect(job.title).toBe('Développeur·se web');
    expect(job.score).toBeGreaterThan(0);
    expect(job.reasons).toEqual(
      expect.arrayContaining([
        'Correspond à tes intérêts professionnels',
        'Mobilise tes compétences clés',
        'Aligné avec tes soft skills',
        'Compatible avec tes valeurs',
        'Correspond à tes conditions de travail préférées',
      ]),
    );
  });

  it('should rank jobs by score descending', async () => {
    await Job.insertMany([
      {
        title: 'Job faible',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: [],
        softSkills: [],
        values: [],
        workConditions: [],
        growthOutlook: 'stable',
      },
      {
        title: 'Job fort',
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: ['autonomy'],
        values: ['learning'],
        workConditions: ['remote'],
        growthOutlook: 'growing',
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

    expect(result[0].title).toBe('Job fort');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('should respect the limit parameter', async () => {
    await Job.insertMany(
      Array.from({ length: 20 }).map((_, i) => ({
        title: `Job ${i}`,
        isActive: true,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: [],
        values: [],
        workConditions: [],
        growthOutlook: 'unknown',
      })),
    );

    const input = {
      interestsProfile: ['RIASEC_I'],
      competenceStrengths: ['analysis'],
      softSkillStrengths: [],
      topValues: [],
      topWorkConditions: [],
    };

    const result = await findRecommendedJobs(input, 5);

    expect(result.length).toBe(5);
  });

  it('should exclude jobs with zero score', async () => {
    await Job.insertMany([
      {
        title: 'Job sans match',
        isActive: true,
        riasec: ['RIASEC_R'],
        competences: [],
        softSkills: [],
        values: [],
        workConditions: [],
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

  it('should ignore inactive jobs', async () => {
    await Job.insertMany([
      {
        title: 'Job inactif',
        isActive: false,
        riasec: ['RIASEC_I'],
        competences: ['analysis'],
        softSkills: [],
        values: [],
        workConditions: [],
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
