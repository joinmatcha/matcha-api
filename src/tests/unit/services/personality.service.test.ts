import mongoose from 'mongoose';

import { PersonalityProfile } from '@/models/PersonalityProfile';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import PersonalityTest from '@/models/PersonalityTest';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import User from '@/models/User';
import {
  getUserPersonalityStatus,
  resetUserPersonalityTest,
  submitUserPersonalityTest,
} from '@/services/personality/test';

describe('Personality service', () => {
  beforeEach(async () => {
    await PersonalityVersion.deleteMany({});
    await PersonalityQuestion.deleteMany({});
    await PersonalityProfile.deleteMany({});
    await PersonalityTest.deleteMany({});
    await User.deleteMany({});
  });

  const seedActiveVersion = async () => {
    const version = await PersonalityVersion.create({
      title: 'MBTI',
      summary: 'Test actif',
      version: '1.0',
      isActive: true,
      status: 'active',
    });

    await PersonalityQuestion.create({
      versionId: version._id,
      version: version.version,
      code: 'q1',
      text: 'Question 1',
      dimension: 'EI',
      options: [{ value: 1, label: 'Oui' }],
      order: 1,
      isActive: true,
    });

    await PersonalityProfile.create({
      versionId: version._id,
      version: version.version,
      key: 'ESTJ',
      label: 'Leader pragmatique',
      description: 'Desc',
      strengths: ['Leadership'],
      weaknesses: ['Rigidite'],
      suggestedSectors: ['Manager'],
      isActive: true,
    });

    return version;
  };

  it('should return completed status from the linked personality test', async () => {
    const version = await seedActiveVersion();
    const user = await User.create({
      email: `linked-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'Linked',
      lastName: 'User',
      consentAccepted: true,
    });

    const test = await PersonalityTest.create({
      userId: user._id,
      templateId: version._id,
      templateVersion: version.version,
      type: 'ESTJ',
      result: 'Leader pragmatique',
    });

    user.personalityTestId = test._id as any;
    await user.save();

    const status = await getUserPersonalityStatus(user._id.toString());

    expect(status).toMatchObject({
      completed: true,
      testId: test._id.toString(),
      personalityType: 'ESTJ',
    });
  });

  it('should backfill personalityTestId from the latest existing test', async () => {
    const version = await seedActiveVersion();
    const user = await User.create({
      email: `backfill-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'Backfill',
      lastName: 'User',
      consentAccepted: true,
    });

    const oldTest = await PersonalityTest.create({
      userId: user._id,
      templateId: version._id,
      templateVersion: version.version,
      type: 'ENTP',
      result: 'Innovateur',
    });

    const latestTest = await PersonalityTest.create({
      userId: user._id,
      templateId: new mongoose.Types.ObjectId(),
      templateVersion: '2.0',
      type: 'ESTJ',
      result: 'Leader pragmatique',
    });

    const status = await getUserPersonalityStatus(user._id.toString());

    expect(status).toMatchObject({
      completed: true,
      testId: latestTest._id.toString(),
      personalityType: 'ESTJ',
    });
    expect(status.testId).not.toBe(oldTest._id.toString());

    const refreshedUser = await User.findById(user._id).lean();
    expect(refreshedUser?.personalityTestId?.toString()).toBe(
      latestTest._id.toString()
    );
  });

  it('should expose the active test when the user has not completed it yet', async () => {
    await seedActiveVersion();
    const user = await User.create({
      email: `pending-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'Pending',
      lastName: 'User',
      consentAccepted: true,
    });

    const status = await getUserPersonalityStatus(user._id.toString());

    expect(status.completed).toBe(false);
    if (status.completed) {
      throw new Error('Expected an incomplete status');
    }
    expect(status.test).toMatchObject({
      version: '1.0',
      title: 'MBTI',
    });
    expect(status.test.questions).toHaveLength(1);
  });

  it('should throw when no active personality version exists', async () => {
    const user = await User.create({
      email: `no-active-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'No',
      lastName: 'Version',
      consentAccepted: true,
    });

    await expect(
      getUserPersonalityStatus(user._id.toString())
    ).rejects.toMatchObject({
      status: 404,
      message: 'Aucun test actif trouvé',
    });
  });

  it('should reject submission when the user already has a linked test', async () => {
    const version = await seedActiveVersion();
    const user = await User.create({
      email: `already-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'Already',
      lastName: 'Done',
      consentAccepted: true,
    });

    const test = await PersonalityTest.create({
      userId: user._id,
      templateId: version._id,
      templateVersion: version.version,
      type: 'ESTJ',
      result: 'Leader pragmatique',
    });

    user.personalityTestId = test._id as any;
    await user.save();

    await expect(
      submitUserPersonalityTest(user._id.toString(), [
        { questionId: 'q1', value: 1 },
      ])
    ).rejects.toMatchObject({
      status: 409,
      message: 'Vous avez déjà passé ce test',
    });
  });

  it('should convert duplicate test creation into a 409 and backfill the user link', async () => {
    const version = await seedActiveVersion();
    const user = await User.create({
      email: `duplicate-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      firstName: 'Duplicate',
      lastName: 'User',
      consentAccepted: true,
    });

    const existingTest = await PersonalityTest.create({
      userId: user._id,
      templateId: version._id,
      templateVersion: version.version,
      type: 'ESTJ',
      result: 'Leader pragmatique',
    });

    await expect(
      submitUserPersonalityTest(user._id.toString(), [
        { questionId: 'q1', value: 1 },
      ])
    ).rejects.toMatchObject({
      status: 409,
      message: 'Vous avez déjà passé ce test',
    });

    const refreshedUser = await User.findById(user._id).lean();
    expect(refreshedUser?.personalityTestId?.toString()).toBe(
      existingTest._id.toString()
    );
  });

  it('should reject reset when the user does not exist', async () => {
    await expect(
      resetUserPersonalityTest(new mongoose.Types.ObjectId().toString())
    ).rejects.toMatchObject({
      status: 404,
      message: 'User not found',
    });
  });
});
