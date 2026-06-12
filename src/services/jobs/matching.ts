import { RomeMetier } from '@/models/RomeMetier';
import { normalizeText } from '@/services/rome/utils';

interface JobMatchInput {
  interestsProfile: string[];
  competenceStrengths: string[];
  softSkillStrengths: string[];
  topValues: string[];
  topWorkConditions: string[];
}

export interface RecommendedJob {
  id: string;
  title: string;
  description?: string;
  sector?: string;
  score: number; // 0-100
  reasons: string[];
}

export async function findRecommendedJobs(
  input: JobMatchInput,
  limit = 4,
  minScore = 60
): Promise<RecommendedJob[]> {
  const normalizedCompetences = input.competenceStrengths.map(normalizeText);
  const normalizedWorkConditions = input.topWorkConditions.map(normalizeText);

  const jobs = await RomeMetier.find({
    isActive: true,
    'riasec.codes': { $in: input.interestsProfile },
  })
    .select(
      '_id code label definition domain riasec skills workContexts transitions'
    )
    .lean();

  const ranked: RecommendedJob[] = jobs.map((job) => {
    const riasecMatches = job.riasec.codes.filter((r) =>
      input.interestsProfile.includes(r)
    );
    const skillMatches = job.skills.filter((skill) =>
      normalizedCompetences.some((competence) =>
        normalizeText(skill.label).includes(competence)
      )
    );
    const contextMatches = job.workContexts.filter((context) =>
      normalizedWorkConditions.some((condition) =>
        normalizeText(context.label).includes(condition)
      )
    );

    const rawScore =
      riasecMatches.length * 55 +
      Math.min(skillMatches.length, 5) * 7 +
      Math.min(contextMatches.length, 3) * 5;
    const normalizedScore = Math.min(100, Math.round(rawScore));

    const reasons: string[] = [];
    if (riasecMatches.length > 0) {
      reasons.push('Compatible avec ton profil d’intérêts');
    }
    if (skillMatches.length > 0) {
      reasons.push('Mobilise des compétences proches de ton profil');
    }
    if (contextMatches.length > 0) {
      reasons.push('Compatible avec tes conditions de travail idéales');
    }

    return {
      id: job._id.toString(),
      title: job.label,
      description: job.definition,
      sector: job.domain?.label ?? job.domain?.grandDomain?.label,
      score: normalizedScore,
      reasons,
    };
  });

  return ranked
    .filter((job) => job.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
