import { BilanAnswerSet } from '@/models/BilanAnswerSet';

export const createAnswerSet = async ({
  userId,
  version,
  answers,
}: {
  userId: string;
  version: number;
  answers: any[];
}) => {
  return BilanAnswerSet.findOneAndUpdate(
    { user: userId, version },
    { answers },
    { upsert: true, new: true },
  );
};

export const getAnswerSet = async (userId: string, version: number) => {
  return BilanAnswerSet.findOne({ user: userId, version });
};
