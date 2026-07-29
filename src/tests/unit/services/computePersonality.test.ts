import mongoose from 'mongoose';

import { PersonalityProfile } from '@/models/PersonalityProfile';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import PersonalityTest from '@/models/PersonalityTest';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import { computePersonality } from '@/services/personality/compute';

describe('computePersonality', () => {
  beforeEach(async () => {
    await PersonalityVersion.deleteMany({});
    await PersonalityQuestion.deleteMany({});
    await PersonalityProfile.deleteMany({});
    await PersonalityTest.deleteMany({});

    const version = await PersonalityVersion.create({
      title: 'Test MBTI',
      summary: 'Test de personnalité de base',
      isActive: true,
      status: 'active',
      version: '1.0',
    });

    await PersonalityQuestion.insertMany([
      {
        versionId: version._id,
        version: version.version,
        code: 'q1',
        text: '...',
        dimension: 'EI',
        options: [],
        order: 1,
        isActive: true,
      },
      {
        versionId: version._id,
        version: version.version,
        code: 'q2',
        text: '...',
        dimension: 'SN',
        options: [],
        order: 2,
        isActive: true,
      },
      {
        versionId: version._id,
        version: version.version,
        code: 'q3',
        text: '...',
        dimension: 'TF',
        options: [],
        order: 3,
        isActive: true,
      },
      {
        versionId: version._id,
        version: version.version,
        code: 'q4',
        text: '...',
        dimension: 'JP',
        options: [],
        order: 4,
        isActive: true,
      },
    ]);

    await PersonalityProfile.create({
      versionId: version._id,
      version: version.version,
      key: 'ESTJ',
      label: 'Leader pragmatique',
      description: 'Orienté efficacité et action.',
      strengths: ['Efficace', 'Décisif'],
      weaknesses: ['Rigide'],
      suggestedSectors: ['Management', 'Gestion de projet'],
      isActive: true,
    });
  });

  it('should compute the correct MBTI type and save it', async () => {
    const answers = [
      { questionId: 'q1', value: 2 },
      { questionId: 'q2', value: 1 },
      { questionId: 'q3', value: 2 },
      { questionId: 'q4', value: 1 },
    ];

    const result = await computePersonality(
      new mongoose.Types.ObjectId().toString(),
      answers
    );

    expect(result.type).toBe('ESTJ');
    expect(result.label).toBe('Leader pragmatique');
    expect(result.strengths).toContain('Efficace');
    expect(result.suggestedSectors).toEqual([
      'Management',
      'Gestion de projet',
    ]);
    expect(result.dimensionInsights).toHaveLength(4);
    expect(result.dimensionInsights[0]).toMatchObject({
      key: 'EI',
      label: 'Énergie relationnelle',
      preference: 'Interaction et échange',
    });
    expect(result.workPreferences).toEqual(
      expect.arrayContaining([expect.stringContaining('échanges réguliers')])
    );

    const testInDb = await PersonalityTest.findOne({ type: 'ESTJ' });
    expect(testInDb).not.toBeNull();
    expect(testInDb?.result).toBe('Leader pragmatique');
    expect(testInDb?.dimensionInsights).toHaveLength(4);
    expect(testInDb?.workPreferences).toHaveLength(4);
  });

  it('should throw if no active test exists', async () => {
    await PersonalityVersion.deleteMany({});
    await PersonalityQuestion.deleteMany({});
    await PersonalityProfile.deleteMany({});
    await expect(
      computePersonality(new mongoose.Types.ObjectId().toString(), [])
    ).rejects.toThrow('Aucun test actif trouvé.');
  });
});
