import { Job } from '@/models/Job';

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
  minScore = 60,
): Promise<RecommendedJob[]> {
  const jobs = await Job.find({
    isActive: true,
    riasec: { $in: input.interestsProfile },
    competences: { $in: input.competenceStrengths },
  })
    .select(
      '_id title description sector riasec competences softSkills values workConditions',
    )
    .lean();

  const ranked: RecommendedJob[] = [];

  for (const job of jobs) {
    const riasecMatches = job.riasec.filter((r) =>
      input.interestsProfile.includes(r),
    );
    const competenceMatches = job.competences.filter((c) =>
      input.competenceStrengths.includes(c),
    );

    if (riasecMatches.length === 0 || competenceMatches.length === 0) {
      continue;
    }

    const softSkillMatches = job.softSkills.filter((s) =>
      input.softSkillStrengths.includes(s),
    );
    const valueMatches = job.values.filter((v) => input.topValues.includes(v));
    const workConditionMatches = job.workConditions.filter((w) =>
      input.topWorkConditions.includes(w),
    );

    const rawScore =
      riasecMatches.length * 5 +
      competenceMatches.length * 4 +
      softSkillMatches.length * 3 +
      valueMatches.length * 2 +
      workConditionMatches.length;

    const maxScore =
      job.riasec.length * 5 +
      job.competences.length * 4 +
      job.softSkills.length * 3 +
      job.values.length * 2 +
      job.workConditions.length;

    // sécurité (job mal seedé)
    if (maxScore <= 0) continue;

    const normalizedScore = Math.round((rawScore / maxScore) * 100);

    // filtre de pertinence
    if (normalizedScore < minScore) continue;

    const reasons: string[] = [];

    if (riasecMatches.length >= 2) {
      reasons.push('Correspond fortement à tes centres d’intérêt');
    } else {
      reasons.push('Compatible avec ton profil d’intérêts');
    }

    if (competenceMatches.length >= 2) {
      reasons.push('Mobilise plusieurs de tes compétences clés');
    } else {
      reasons.push('Mobilise une compétence clé');
    }

    if (valueMatches.length) {
      reasons.push('Aligné avec ce qui te motive au travail');
    }

    if (workConditionMatches.length) {
      reasons.push('Compatible avec tes conditions de travail idéales');
    }

    ranked.push({
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      sector: job.sector,
      score: normalizedScore,
      reasons,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}
