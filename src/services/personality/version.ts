import { PersonalityProfile } from '@/models/PersonalityProfile';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import { PersonalityVersion } from '@/models/PersonalityVersion';

type PersonalityQuestionDTO = {
  id: string;
  text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  options: { value: number; label: string }[];
  order?: number;
};

type PersonalityProfileDTO = {
  key: string;
  label?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedJobs?: string[];
};

export type ActivePersonalityVersion = {
  id: string;
  version: string;
  title: string;
  summary?: string;
  isActive: boolean;
  status?: 'draft' | 'active' | 'archived';
  questions: PersonalityQuestionDTO[];
  profiles: PersonalityProfileDTO[];
};

export const getActivePersonalityVersion =
  async (): Promise<ActivePersonalityVersion | null> => {
    const version = await PersonalityVersion.findOne({ isActive: true })
      .sort({ updatedAt: -1 })
      .lean();

    if (!version) {
      return null;
    }

    const [questions, profiles] = await Promise.all([
      PersonalityQuestion.find({
        versionId: version._id,
        isActive: true,
      })
        .sort({ order: 1, createdAt: 1 })
        .lean(),
      PersonalityProfile.find({
        versionId: version._id,
        isActive: true,
      })
        .sort({ key: 1 })
        .lean(),
    ]);

    return {
      id: version._id.toString(),
      version: version.version,
      title: version.title,
      summary: version.summary ?? undefined,
      isActive: version.isActive,
      status: version.status,
      questions: questions.map((question) => ({
        id: question.code,
        text: question.text,
        dimension: question.dimension,
        options: question.options ?? [],
        order: question.order,
      })),
      profiles: profiles.map((profile) => ({
        key: profile.key,
        label: profile.label,
        description: profile.description,
        strengths: profile.strengths ?? [],
        weaknesses: profile.weaknesses ?? [],
        recommendedJobs: profile.recommendedJobs ?? [],
      })),
    };
  };
