import { BilanAnswer } from '@/models/BilanAnswerSet';
import { BilanQuestionDocument } from '@/models/BilanQuestion';

export type ScoreMap = Record<string, number>;

export interface AggregatedScores {
  competence: ScoreMap;
  soft_skill: ScoreMap;
  value: ScoreMap;
  work_condition: ScoreMap;
  interest: ScoreMap;
  feasibility: ScoreMap;
}

export interface SkillClassification {
  strengths: string[]; // ex: ["analysis", "communication"]
  acquired: string[];
  toImprove: string[];
}

/**
 * Agrège les réponses likert par (domain, subdomain)
 * et calcule une moyenne par sous-domaine.
 */
export function aggregateScores(
  questions: Pick<
    BilanQuestionDocument,
    'code' | 'domain' | 'subdomain' | 'type'
  >[],
  answers: BilanAnswer[]
): AggregatedScores {
  const result: AggregatedScores = {
    competence: {},
    soft_skill: {},
    value: {},
    work_condition: {},
    interest: {},
    feasibility: {},
  };

  const buckets: Record<string, { sum: number; count: number }> = {};

  for (const q of questions) {
    if (q.type !== 'likert_1_5') continue;
    if (!q.subdomain) continue;

    const answer = answers.find((a) => a.questionCode === q.code);
    if (!answer || typeof answer.valueNumber !== 'number') continue;

    const key = `${q.domain}:${q.subdomain}`;

    if (!buckets[key]) {
      buckets[key] = { sum: 0, count: 0 };
    }

    buckets[key].sum += answer.valueNumber;
    buckets[key].count += 1;
  }

  for (const [key, { sum, count }] of Object.entries(buckets)) {
    const [domain, subdomain] = key.split(':') as [
      keyof AggregatedScores,
      string,
    ];

    result[domain][subdomain] = sum / count;
  }

  return result;
}

/**
 * Classe les sous-domaines en forces / acquis / à améliorer
 */
export function classifyCompetences(scores: ScoreMap): SkillClassification {
  const result: SkillClassification = {
    strengths: [],
    acquired: [],
    toImprove: [],
  };

  for (const [subdomain, avg] of Object.entries(scores)) {
    if (avg >= 4) result.strengths.push(subdomain);
    else if (avg >= 3) result.acquired.push(subdomain);
    else result.toImprove.push(subdomain);
  }

  return result;
}

/**
 * Retourne les N sous-domaines les mieux scorés
 */
export function topKeys(scores: ScoreMap, n = 3, minScore = 0): string[] {
  return Object.entries(scores)
    .filter(([, score]) => score >= minScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}
