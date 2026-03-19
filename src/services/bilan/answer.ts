import {
  BilanAnswer,
  BilanAnswerSet,
  BilanAnswerSetDocument,
} from '@/models/BilanAnswerSet';

export const createAnswerSet = async ({
  userId,
  version,
  answers,
}: {
  userId: string;
  version: number;
  answers: BilanAnswer[];
}): Promise<BilanAnswerSetDocument | null> => {
  return BilanAnswerSet.findOneAndUpdate(
    { user: userId, version },
    { answers },
    { upsert: true, new: true }
  );
};

export const getAnswerSet = async (
  userId: string,
  version: number
): Promise<BilanAnswerSetDocument | null> => {
  return BilanAnswerSet.findOne({ user: userId, version });
};
