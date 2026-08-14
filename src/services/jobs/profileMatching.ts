import { Types } from 'mongoose';

import { BilanCompetence } from '@/models/BilanCompetence';
import PersonalityTest from '@/models/PersonalityTest';
import { RecommendationProfile } from '@/models/RecommendationProfile';
import { RomeMetier, RomeMetierDocument } from '@/models/RomeMetier';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { normalizeText } from '@/services/rome/utils';
import { computePreferences } from '@/services/users/preferences';

type WeightedSignal = {
  key: string;
  label: string;
  weight: number;
  sources: string[];
};

type SignalMap = Map<string, WeightedSignal>;

export type ProfileMatchJob = {
  id: string;
  code: string;
  title: string;
  description?: string;
  sector?: string;
  score: number;
  reasons: string[];
};

export const ALGORITHM_VERSION = 'profile-matching-v4';
const SCORE_WEIGHTS = {
  interests: 35,
  sectors: 20,
  skills: 25,
  workConditions: 15,
  confidence: 5,
} as const;
const SIGNAL_RANK_DECAY = [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28, 0.22];

export type ProfileMatchingSummary = {
  unlocked: boolean;
  missingTests: Array<'bilan' | 'personality' | 'work_style'>;
  sectors: WeightedSignal[];
  interests: WeightedSignal[];
  skills: WeightedSignal[];
  workConditions: WeightedSignal[];
  jobs: ProfileMatchJob[];
};

type JobLike = Pick<
  RomeMetierDocument,
  | '_id'
  | 'code'
  | 'label'
  | 'definition'
  | 'domain'
  | 'riasec'
  | 'skills'
  | 'workContexts'
  | 'themes'
  | 'sectors'
  | 'transitions'
>;

const WORK_STYLE_AXIS_TO_TERMS: Record<string, string[]> = {
  autonomy: ['autonomie', 'indépendance', 'initiative'],
  collaboration: ['équipe', 'collaboration', 'coordination', 'partenaire'],
  pace: ['rythme', 'dynamique', 'réactivité', 'urgence'],
  structure: ['structure', 'procédure', 'contrôle', 'qualité', 'règle'],
  variety: ['variété', 'polyvalence', 'projet', 'divers'],
  human_contact: ['contact humain', 'client', 'public', 'conseil', 'relation'],
  mobility: ['terrain', 'déplacement', 'chantier', 'site', 'extérieur'],
  learning: ['apprentissage', 'formation', 'veille', 'innovation', 'analyse'],
};

const PERSONALITY_TYPE_TO_RIASEC: Record<string, string[]> = {
  INTJ: ['RIASEC_I', 'RIASEC_E'],
  INTP: ['RIASEC_I'],
  ENTJ: ['RIASEC_E', 'RIASEC_C'],
  ENTP: ['RIASEC_E', 'RIASEC_A', 'RIASEC_I'],
  INFJ: ['RIASEC_S', 'RIASEC_I'],
  INFP: ['RIASEC_A', 'RIASEC_S'],
  ENFJ: ['RIASEC_S', 'RIASEC_E'],
  ENFP: ['RIASEC_A', 'RIASEC_S', 'RIASEC_E'],
  ISTJ: ['RIASEC_C', 'RIASEC_R'],
  ISFJ: ['RIASEC_S', 'RIASEC_C'],
  ESTJ: ['RIASEC_E', 'RIASEC_C'],
  ESFJ: ['RIASEC_S', 'RIASEC_E'],
  ISTP: ['RIASEC_R', 'RIASEC_I'],
  ISFP: ['RIASEC_A', 'RIASEC_R'],
  ESTP: ['RIASEC_E', 'RIASEC_R'],
  ESFP: ['RIASEC_S', 'RIASEC_A', 'RIASEC_E'],
};

function addSignal(
  map: SignalMap,
  label: string | null | undefined,
  weight: number,
  source: string
) {
  const trimmed = label?.trim();
  if (!trimmed) return;

  const key = normalizeText(trimmed);
  const current = map.get(key);
  if (!current) {
    map.set(key, { key, label: trimmed, weight, sources: [source] });
    return;
  }

  current.weight += weight;
  if (!current.sources.includes(source)) current.sources.push(source);
}

function rankedSignals(map: SignalMap, limit = 8): WeightedSignal[] {
  return [...map.values()]
    .filter((signal) => signal.weight > 0)
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        b.sources.length - a.sources.length ||
        a.label.localeCompare(b.label)
    )
    .slice(0, limit)
    .map((signal) => ({
      ...signal,
      weight: Math.round(signal.weight * 10) / 10,
    }));
}

function includesNormalized(haystack: string | undefined, needle: string) {
  return Boolean(haystack && normalizeText(haystack).includes(needle));
}

function buildJobText(job: JobLike) {
  return [
    job.label,
    job.definition,
    job.domain?.label,
    job.domain?.grandDomain?.label,
    ...(job.skills ?? []).map((item) => item.label),
    ...(job.workContexts ?? []).map((item) => item.label),
    ...(job.themes ?? []).map((item) => item.label),
    ...(job.sectors ?? []).map((item) => item.label),
  ]
    .filter(Boolean)
    .join(' ');
}

function rankedWeight(signal: WeightedSignal, index: number) {
  return signal.weight * (SIGNAL_RANK_DECAY[index] ?? 0.18);
}

function weightedCoverageScore({
  signals,
  maxScore,
  signalLimit,
  matches,
}: {
  signals: WeightedSignal[];
  maxScore: number;
  signalLimit: number;
  matches: (signal: WeightedSignal) => boolean;
}) {
  const scoredSignals = signals.slice(0, signalLimit).map((signal, index) => ({
    signal,
    weight: rankedWeight(signal, index),
  }));
  const totalWeight = scoredSignals.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return { score: 0, matchedCount: 0 };

  const matched = scoredSignals.filter(({ signal }) => matches(signal));
  const matchedWeight = matched.reduce((sum, item) => sum + item.weight, 0);

  return {
    score: (matchedWeight / totalWeight) * maxScore,
    matchedCount: matched.length,
  };
}

export type JobScoringSignals = Omit<
  ProfileMatchingSummary,
  'jobs' | 'unlocked' | 'missingTests'
>;

function matchesAnySectorSignal(job: JobLike, signals: WeightedSignal[]) {
  const sectorLabel = job.domain?.label ?? job.domain?.grandDomain?.label;

  return signals.some(
    (sector) =>
      includesNormalized(sectorLabel, sector.key) ||
      (job.sectors ?? []).some((item) =>
        includesNormalized(item.label, sector.key)
      ) ||
      (job.themes ?? []).some((item) =>
        includesNormalized(item.label, sector.key)
      )
  );
}

function matchesAnyProfileSkill(job: JobLike, signals: WeightedSignal[]) {
  const text = buildJobText(job);

  return signals.some((signal) => includesNormalized(text, signal.key));
}

function hasEnoughProfileEvidence(
  job: JobLike,
  signals: JobScoringSignals,
  score: number
) {
  if (score <= 0) return false;
  const riasecCodes = job.riasec?.codes ?? [];
  const hasInterestMatch = signals.interests.some((interest) =>
    riasecCodes.includes(interest.label)
  );
  if (!hasInterestMatch) return false;

  return (
    matchesAnySectorSignal(job, signals.sectors) ||
    matchesAnyProfileSkill(job, signals.skills)
  );
}

export function scoreJobForProfile(
  job: JobLike,
  signals: JobScoringSignals
): ProfileMatchJob {
  const scoredJob = computeJobScore(job, signals);

  return hasEnoughProfileEvidence(job, signals, scoredJob.score)
    ? scoredJob
    : { ...scoredJob, score: 0, reasons: [] };
}

function computeJobScore(
  job: JobLike,
  signals: JobScoringSignals
): ProfileMatchJob {
  const text = buildJobText(job);
  const sectorLabel = job.domain?.label ?? job.domain?.grandDomain?.label;
  const reasons = new Set<string>();

  const riasecCodes = job.riasec?.codes ?? [];
  const interest = weightedCoverageScore({
    signals: signals.interests,
    maxScore: SCORE_WEIGHTS.interests,
    signalLimit: 4,
    matches: (signal) => riasecCodes.includes(signal.label),
  });
  if (interest.matchedCount > 0) {
    reasons.add('Compatible avec tes intérêts dominants');
  }

  const sector = weightedCoverageScore({
    signals: signals.sectors,
    maxScore: SCORE_WEIGHTS.sectors,
    signalLimit: 6,
    matches: (signal) =>
      includesNormalized(sectorLabel, signal.key) ||
      (job.sectors ?? []).some((item) =>
        includesNormalized(item.label, signal.key)
      ) ||
      (job.themes ?? []).some((item) =>
        includesNormalized(item.label, signal.key)
      ),
  });
  if (sector.matchedCount > 0) {
    reasons.add('Dans un secteur qui ressort de ton profil');
  }

  const skills = weightedCoverageScore({
    signals: signals.skills,
    maxScore: SCORE_WEIGHTS.skills,
    signalLimit: 8,
    matches: (signal) => includesNormalized(text, signal.key),
  });
  if (skills.matchedCount > 0) {
    reasons.add('Mobilise des forces ou compétences proches des tiennes');
  }

  const workConditions = weightedCoverageScore({
    signals: signals.workConditions,
    maxScore: SCORE_WEIGHTS.workConditions,
    signalLimit: 6,
    matches: (signal) => includesNormalized(text, signal.key),
  });
  if (workConditions.matchedCount > 0) {
    reasons.add('Compatible avec ton style ou tes conditions de travail');
  }

  const matchedDimensions = [
    interest.score,
    sector.score,
    skills.score,
    workConditions.score,
  ].filter((score) => score > 0).length;
  const confidenceScore =
    matchedDimensions >= 4
      ? SCORE_WEIGHTS.confidence
      : matchedDimensions === 3
        ? 3
        : matchedDimensions === 2
          ? 1
          : 0;

  const score =
    interest.score +
    sector.score +
    skills.score +
    workConditions.score +
    confidenceScore;

  return {
    id: job._id.toString(),
    code: job.code,
    title: job.label,
    description: job.definition,
    sector: sectorLabel,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: [...reasons].slice(0, 3),
  };
}

export function diversifyMatchedJobs(jobs: ProfileMatchJob[], limit: number) {
  const selected: ProfileMatchJob[] = [];
  const sectorCounts = new Map<string, number>();
  const maxPerSector = limit <= 10 ? 2 : 3;

  for (const job of jobs) {
    const sectorKey = normalizeText(job.sector ?? 'Autre');
    const count = sectorCounts.get(sectorKey) ?? 0;
    if (count >= maxPerSector) continue;

    selected.push(job);
    sectorCounts.set(sectorKey, count + 1);
    if (selected.length >= limit) return selected;
  }

  for (const job of jobs) {
    if (selected.some((selectedJob) => selectedJob.id === job.id)) continue;
    selected.push(job);
    if (selected.length >= limit) break;
  }

  return selected;
}

export async function buildProfileMatching(
  userId: string,
  {
    limit = 20,
    excludedJobIds = [],
    minScore = 20,
  }: {
    limit?: number;
    excludedJobIds?: Types.ObjectId[];
    minScore?: number;
  } = {}
): Promise<ProfileMatchingSummary> {
  const user = await User.findById(userId).lean();
  const userObjectId = new Types.ObjectId(userId);

  const [bilan, personality, workStyle, preferences] = await Promise.all([
    BilanCompetence.findOne({ user: userObjectId })
      .sort({ createdAt: -1 })
      .lean(),
    user?.personalityTestId
      ? PersonalityTest.findById(user.personalityTestId).lean()
      : PersonalityTest.findOne({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .lean(),
    WorkStyleResult.findOne({ user: userObjectId })
      .sort({ createdAt: -1 })
      .lean(),
    computePreferences(userId),
  ]);

  const sectorSignals: SignalMap = new Map();
  const interestSignals: SignalMap = new Map();
  const skillSignals: SignalMap = new Map();
  const workConditionSignals: SignalMap = new Map();

  for (const interest of bilan?.investigation.interestsProfile ?? []) {
    addSignal(interestSignals, interest, 2.4, 'Auto-évaluation');
  }
  for (const strength of bilan?.investigation.competence.strengths ?? []) {
    addSignal(skillSignals, strength, 1.8, 'Auto-évaluation');
  }
  for (const strength of bilan?.investigation.softSkills.strengths ?? []) {
    addSignal(skillSignals, strength, 1.4, 'Auto-évaluation');
  }
  for (const value of bilan?.investigation.topValues ?? []) {
    addSignal(sectorSignals, value, 1.1, 'Auto-évaluation');
    addSignal(skillSignals, value, 0.8, 'Auto-évaluation');
  }
  for (const condition of bilan?.investigation.topWorkConditions ?? []) {
    addSignal(workConditionSignals, condition, 1.6, 'Auto-évaluation');
  }
  for (const sector of bilan?.conclusion.recommendedSectors ?? []) {
    addSignal(sectorSignals, sector, 1.4, 'Auto-évaluation');
  }

  if (personality?.type) {
    for (const interest of PERSONALITY_TYPE_TO_RIASEC[personality.type] ?? []) {
      addSignal(interestSignals, interest, 1.2, 'Personnalité');
    }
  }
  for (const trait of personality?.traits ?? []) {
    addSignal(skillSignals, trait, 1.1, 'Personnalité');
  }
  for (const sector of personality?.suggestedSectors ?? []) {
    addSignal(sectorSignals, sector, 0.9, 'Personnalité');
    addSignal(skillSignals, sector, 0.6, 'Personnalité');
  }

  for (const axis of workStyle?.topAxes ?? []) {
    for (const term of WORK_STYLE_AXIS_TO_TERMS[axis] ?? [axis]) {
      addSignal(workConditionSignals, term, 1.2, 'Style professionnel');
    }
  }
  for (const strength of workStyle?.profile?.strengths ?? []) {
    addSignal(skillSignals, strength, 1, 'Style professionnel');
  }

  for (const sector of preferences.topSectors) {
    addSignal(sectorSignals, sector.key, sector.score * 1.2, 'Métiers likés');
  }
  for (const tag of preferences.topTags) {
    addSignal(sectorSignals, tag.key, tag.score * 0.7, 'Métiers likés');
  }
  for (const competence of preferences.topCompetences) {
    addSignal(skillSignals, competence.key, competence.score, 'Métiers likés');
  }
  for (const condition of preferences.topWorkConditions) {
    addSignal(
      workConditionSignals,
      condition.key,
      condition.score,
      'Métiers likés'
    );
  }

  const signals = {
    sectors: rankedSignals(sectorSignals, 10),
    interests: rankedSignals(interestSignals, 6),
    skills: rankedSignals(skillSignals, 12),
    workConditions: rankedSignals(workConditionSignals, 10),
  };

  const missingTests: ProfileMatchingSummary['missingTests'] = [];
  if (!bilan) missingTests.push('bilan');
  if (!personality) missingTests.push('personality');
  if (!workStyle) missingTests.push('work_style');
  const unlocked = missingTests.length === 0;

  if (!unlocked) {
    return {
      unlocked,
      missingTests,
      ...signals,
      jobs: [],
    };
  }

  const riasecFilter = signals.interests.map((signal) => signal.label);
  const query: Record<string, unknown> = {
    isActive: true,
    _id: { $nin: excludedJobIds },
  };
  if (riasecFilter.length > 0) {
    query['riasec.codes'] = { $in: riasecFilter };
  }

  const jobs = await RomeMetier.find(query)
    .select(
      '_id code label definition domain riasec skills workContexts themes sectors transitions'
    )
    .limit(500)
    .lean<JobLike[]>();

  const rankedJobs = jobs
    .map((job) => scoreJobForProfile(job, signals))
    .filter((job) => job.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return {
    unlocked,
    missingTests,
    ...signals,
    jobs: diversifyMatchedJobs(rankedJobs, limit),
  };
}

export async function refreshRecommendationProfile(userId: string) {
  const matching = await buildProfileMatching(userId, {
    limit: 20,
    minScore: 40,
  });

  const missingSources = matching.missingTests.map((test) =>
    test === 'work_style' ? 'work_style' : test
  );
  const completedSources = (['bilan', 'personality', 'work_style'] as const)
    .filter((source) => !missingSources.includes(source))
    .map((source) => source);

  const profile = await RecommendationProfile.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        algorithmVersion: ALGORITHM_VERSION,
        completedSources,
        missingSources,
        unlocked: matching.unlocked,
        sectors: matching.sectors,
        interests: matching.interests,
        skills: matching.skills,
        workConditions: matching.workConditions,
        matchedJobs: matching.jobs.map((job) => ({
          jobId: new Types.ObjectId(job.id),
          code: job.code,
          title: job.title,
          sector: job.sector,
          score: job.score,
          reasons: job.reasons,
        })),
        recalculatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  ).lean();

  return profile;
}

export async function getPersonalizedDeckJobs({
  userId,
  excludedJobIds,
  limit,
}: {
  userId: string;
  excludedJobIds: Types.ObjectId[];
  limit: number;
}) {
  const matching = await buildProfileMatching(userId, {
    excludedJobIds,
    limit,
    minScore: 40,
  });

  return matching.jobs;
}
