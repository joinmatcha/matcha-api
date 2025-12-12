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
  score: number;
  reasons: string[];
}

export async function findRecommendedJobs(
  input: JobMatchInput,
  limit = 12,
): Promise<RecommendedJob[]> {
  const jobs = await Job.find({ isActive: true });

  return jobs
    .map((job) => {
      let score = 0;
      const reasons: string[] = [];

      const riasecMatches = job.riasec.filter((r) =>
        input.interestsProfile.includes(r),
      );
      if (riasecMatches.length) {
        score += riasecMatches.length * 4;
        reasons.push('Correspond à tes intérêts professionnels');
      }

      const competenceMatches = job.competences.filter((c) =>
        input.competenceStrengths.includes(c),
      );
      if (competenceMatches.length) {
        score += competenceMatches.length * 3;
        reasons.push('Mobilise tes compétences clés');
      }

      const softSkillMatches = job.softSkills.filter((s) =>
        input.softSkillStrengths.includes(s),
      );
      if (softSkillMatches.length) {
        score += softSkillMatches.length * 2;
        reasons.push('Aligné avec tes soft skills');
      }

      const valueMatches = job.values.filter((v) =>
        input.topValues.includes(v),
      );
      if (valueMatches.length) {
        score += valueMatches.length * 2;
        reasons.push('Compatible avec tes valeurs');
      }

      const workConditionMatches = job.workConditions.filter((w) =>
        input.topWorkConditions.includes(w),
      );
      if (workConditionMatches.length) {
        score += workConditionMatches.length;
        reasons.push('Correspond à tes conditions de travail préférées');
      }

      return {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        sector: job.sector,
        score,
        reasons,
      };
    })
    .filter((job) => job.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
