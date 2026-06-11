import {
  type RecommendedJob,
  findRecommendedJobs,
} from '@/services/jobs/matching';
import { BilanConclusionDTO } from '@/types/bilan';
import { resolveArchetype } from '@/utils/archetypeResolver';
import { mapSubdomainsToLabels } from '@/utils/bilanLabelMapper';

interface GenerateConclusionInput {
  competenceStrengths: string[];
  competenceToImprove: string[];
  softSkillStrengths: string[];
  softSkillToImprove: string[];
  topValues: string[];
  topWorkConditions: string[];
  interestsProfile: string[];
  feasibilityProfile: string[];
}

export const generateConclusion = async ({
  competenceStrengths,
  competenceToImprove,
  softSkillStrengths,
  softSkillToImprove,
  topValues,
  topWorkConditions,
  interestsProfile,
  feasibilityProfile,
}: GenerateConclusionInput): Promise<{
  conclusion: BilanConclusionDTO;
  mappedTopValues: string[];
  mappedTopWorkConditions: string[];
}> => {
  const mappedStrengths = [
    ...mapSubdomainsToLabels('competence', competenceStrengths),
    ...mapSubdomainsToLabels('soft_skill', softSkillStrengths),
  ];

  const mappedImprovementAxes = [
    ...mapSubdomainsToLabels('competence', competenceToImprove),
    ...mapSubdomainsToLabels('soft_skill', softSkillToImprove),
  ];

  const mappedTopValues = mapSubdomainsToLabels('value', topValues);
  const mappedTopWorkConditions = mapSubdomainsToLabels(
    'work_condition',
    topWorkConditions
  );
  const mappedFeasibility = mapSubdomainsToLabels(
    'feasibility',
    feasibilityProfile
  );

  const archetype = resolveArchetype({
    interestsProfile,
    mappedStrengths,
    mappedTopValues,
    mappedTopWorkConditions,
  });

  const profileSummary =
    [
      mappedStrengths.length
        ? `Vous présentez des forces marquées sur les dimensions suivantes : ${mappedStrengths.join(', ')}.`
        : '',
      mappedTopValues.length
        ? `Vos valeurs professionnelles prioritaires sont : ${mappedTopValues.join(', ')}.`
        : '',
      mappedTopWorkConditions.length
        ? `Les conditions de travail importantes pour vous sont : ${mappedTopWorkConditions.join(', ')}.`
        : '',
      interestsProfile.length
        ? `Votre profil d’intérêts dominant est : ${interestsProfile.join(' + ')}.`
        : '',
      mappedFeasibility.length
        ? `Vos conditions de reconversion favorables sont : ${mappedFeasibility.join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n') ||
    'Cette auto-évaluation met en évidence vos axes de progression et constitue une base de réflexion pour votre évolution professionnelle.';

  const recommendedJobs = await findRecommendedJobs({
    interestsProfile,
    competenceStrengths,
    softSkillStrengths,
    topValues,
    topWorkConditions,
  });

  const recommendedEnvironments = [
    ...new Set(
      recommendedJobs
        .map((job: RecommendedJob) => job.sector)
        .filter((sector): sector is string => Boolean(sector))
    ),
  ];

  const conclusion: BilanConclusionDTO = {
    archetype,
    profileSummary,
    keyStrengths: mappedStrengths,
    improvementAxes: mappedImprovementAxes,
    recommendedEnvironments,
    recommendedJobs,
    actionPlan: [
      'Sélectionner 1 à 2 pistes métiers et approfondir leur réalité (missions, compétences, formations).',
      'Identifier les écarts entre vos compétences actuelles et celles requises.',
      'Évaluer la faisabilité concrète de chaque piste (formation, mobilité, rythme, impact financier).',
      'Construire un plan de montée en compétences ciblé (formations, projets, expériences).',
      'Échanger avec des professionnels du secteur pour confronter votre projet à la réalité.',
    ],
  };

  return {
    conclusion,
    mappedTopValues,
    mappedTopWorkConditions,
  };
};
