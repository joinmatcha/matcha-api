import { BilanQuestion } from '@/models/BilanQuestion';

export const getLatestVersion = async () => {
  const q = await BilanQuestion.findOne().sort({ version: -1 });
  return q?.version ?? 1;
};

export const getQuestionsByVersion = async (version: number) => {
  return BilanQuestion.find({ version, isActive: true }).sort({ code: 1 });
};
