import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';

export const getLatestVersion = async () => {
  const activeVersion = await BilanVersion.findOne({ isActive: true })
    .sort({ version: -1 })
    .lean();
  if (activeVersion) {
    return activeVersion.version;
  }

  const q = await BilanQuestion.findOne().sort({ version: -1 });
  return q?.version ?? 1;
};

export const getQuestionsByVersion = async (version: number) => {
  return BilanQuestion.find({ version, isActive: true }).sort({ code: 1 });
};
