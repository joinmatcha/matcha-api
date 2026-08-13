import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import { PersonalityProfile } from '@/models/PersonalityProfile';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import { WorkStyleQuestion } from '@/models/WorkStyleQuestion';
import { WorkStyleVersion } from '@/models/WorkStyleVersion';
import { bilanQuestions } from '@/seeds/bilanQuestions';
import { seedBilan } from '@/seeds/seedBilan';
import { seedPersonalityTest } from '@/seeds/seedPersonalityTest';
import { seedWorkStyle } from '@/seeds/seedWorkStyle';
import {
  workStyleQuestions,
  workStyleSeedVersion,
} from '@/seeds/workStyleSeed';

describe('seed idempotency', () => {
  it('resynchronizes personality seed without duplicating documents', async () => {
    await seedPersonalityTest();
    await PersonalityQuestion.updateOne(
      { version: '1.0', code: 'q1' },
      { $set: { text: 'Corrupted question' } }
    );

    await seedPersonalityTest();

    const version = await PersonalityVersion.findOne({ version: '1.0' });
    expect(version?.isActive).toBe(true);
    expect(await PersonalityQuestion.countDocuments({ version: '1.0' })).toBe(
      24
    );
    expect(await PersonalityProfile.countDocuments({ version: '1.0' })).toBe(
      16
    );
    await expect(
      PersonalityQuestion.findOne({ version: '1.0', code: 'q1' }).lean()
    ).resolves.toMatchObject({
      text: 'Je me ressource au contact des autres.',
      order: 1,
      isActive: true,
    });
  });

  it('resynchronizes bilan questions and keeps a single active version', async () => {
    await seedBilan();
    await BilanQuestion.updateOne(
      { version: 2, code: 'C1' },
      { $set: { question: 'Corrupted question' } }
    );

    await seedBilan();

    expect(await BilanVersion.countDocuments({ isActive: true })).toBe(1);
    expect(await BilanQuestion.countDocuments({ version: 2 })).toBe(
      bilanQuestions.length
    );
    await expect(
      BilanQuestion.findOne({ version: 2, code: 'C1' }).lean()
    ).resolves.toMatchObject({
      question:
        'Je suis à l’aise pour analyser une situation complexe et en dégager l’essentiel.',
      isActive: true,
    });
  });

  it('resynchronizes work style questions without duplicating documents', async () => {
    await seedWorkStyle({ version: workStyleSeedVersion });
    await WorkStyleQuestion.updateOne(
      { version: workStyleSeedVersion, code: 'AUT_1' },
      { $set: { text: 'Corrupted question' } }
    );

    await seedWorkStyle({ version: workStyleSeedVersion });

    expect(await WorkStyleVersion.countDocuments({ isActive: true })).toBe(1);
    expect(
      await WorkStyleQuestion.countDocuments({ version: workStyleSeedVersion })
    ).toBe(workStyleQuestions.length);
    await expect(
      WorkStyleQuestion.findOne({
        version: workStyleSeedVersion,
        code: 'AUT_1',
      }).lean()
    ).resolves.toMatchObject({
      text: 'Je préfère organiser moi-même ma façon de travailler.',
      isActive: true,
    });
  });
});
