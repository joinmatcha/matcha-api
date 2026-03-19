import PersonalityTemplate from '@/models/PersonalityTemplate';
import PersonalityTest from '@/models/PersonalityTest';
import User from '@/models/User';
import { computePersonality } from '@/services/personality';
import { HttpError } from '@/utils/httpError';

export interface PersonalityAnswerInput {
  questionId: string;
  value: number;
}

export const getUserPersonalityStatus = async (userId: string) => {
  const user = await User.findById(userId)
    .select('_id personalityTestId')
    .lean();

  if (user?.personalityTestId) {
    const existingTest = await PersonalityTest.findById(user.personalityTestId)
      .select('_id type')
      .lean();

    if (existingTest) {
      return {
        completed: true as const,
        testId: existingTest._id.toString(),
        personalityType: existingTest.type,
      };
    }
  }

  const existingTest = await PersonalityTest.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('_id type')
    .lean();

  if (existingTest) {
    await User.updateOne(
      { _id: userId, personalityTestId: { $exists: false } },
      { $set: { personalityTestId: existingTest._id } }
    );

    return {
      completed: true as const,
      testId: existingTest._id.toString(),
      personalityType: existingTest.type,
    };
  }

  const test = await PersonalityTemplate.findOne({ isActive: true }).lean();
  if (!test) {
    throw new HttpError(404, 'Aucun test actif trouvé');
  }

  return {
    completed: false as const,
    test,
  };
};

export const submitUserPersonalityTest = async (
  userId: string,
  answers: PersonalityAnswerInput[]
) => {
  const user = await User.findById(userId)
    .select('_id personalityTestId')
    .lean();

  if (user?.personalityTestId) {
    throw new HttpError(409, 'Vous avez déjà passé ce test');
  }

  try {
    const result = await computePersonality(userId, answers);
    return result;
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      const existingTest = await PersonalityTest.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean();

      if (existingTest) {
        await User.updateOne(
          { _id: userId },
          { $set: { personalityTestId: existingTest._id } }
        );
      }

      throw new HttpError(409, 'Vous avez déjà passé ce test');
    }

    throw error;
  }
};

export const resetUserPersonalityTest = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.personalityTestId) {
    await PersonalityTest.findByIdAndDelete(user.personalityTestId);
    user.personalityTestId = undefined;
    await user.save();
  }
};
