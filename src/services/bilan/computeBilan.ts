import { BilanAnswerSetDocument } from '@/models/BilanAnswerSet';
import { BilanCompetence } from '@/models/BilanCompetence';
import { BilanQuestionDocument } from '@/models/BilanQuestion';
import { refreshRecommendationProfile } from '@/services/jobs/profileMatching';
import {
  aggregateScores,
  classifyCompetences,
  topKeys,
} from '@/utils/bilanScoring';

import { generateConclusion } from './generateConclusion';

export const computeAndStoreBilan = async (
  questions: Pick<
    BilanQuestionDocument,
    'code' | 'domain' | 'subdomain' | 'type'
  >[],
  answerSet: BilanAnswerSetDocument
) => {
  const { user, version, answers } = answerSet;

  const scores = aggregateScores(questions, answers);

  const competence = classifyCompetences(scores.competence);
  const softSkills = classifyCompetences(scores.soft_skill);

  const topValues = topKeys(scores.value, 3, 3.5);
  const topWorkConditions = topKeys(scores.work_condition, 3, 3.5);
  const interestsProfile = topKeys(scores.interest, 2, 3.5);
  const feasibilityProfile = topKeys(scores.feasibility, 3, 3.5);

  const { conclusion, mappedTopValues, mappedTopWorkConditions } =
    await generateConclusion({
      competenceStrengths: competence.strengths,
      competenceToImprove: competence.toImprove,
      softSkillStrengths: softSkills.strengths,
      softSkillToImprove: softSkills.toImprove,
      topValues,
      topWorkConditions,
      interestsProfile,
      feasibilityProfile,
    });

  const bilan = await BilanCompetence.create({
    user,
    version,
    rawAnswers: answers,
    scores,
    investigation: {
      competence,
      softSkills,
      topValues: mappedTopValues,
      topWorkConditions: mappedTopWorkConditions,
      interestsProfile,
      feasibilityProfile,
    },
    conclusion,
  });

  await refreshRecommendationProfile(user.toString());

  return bilan;
};
