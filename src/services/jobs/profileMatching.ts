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

const ALGORITHM_VERSION = 'profile-matching-v2';

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

export type JobScoringSignals = Omit<
  ProfileMatchingSummary,
  'jobs' | 'unlocked' | 'missingTests'
>;

export function scoreJobForProfile(
  job: JobLike,
  signals: JobScoringSignals
): ProfileMatchJob {
  const text = buildJobText(job);
  const sectorLabel = job.domain?.label ?? job.domain?.grandDomain?.label;
  const reasons = new Set<string>();
  let score = 0;

  const riasecCodes = job.riasec?.codes ?? [];
  for (const interest of signals.interests) {
    if (riasecCodes.includes(interest.label)) {
      score += interest.weight * 12;
      reasons.add('Compatible avec tes intérêts dominants');
    }
  }

  for (const sector of signals.sectors) {
    const sectorMatch =
      includesNormalized(sectorLabel, sector.key) ||
      (job.sectors ?? []).some((item) =>
        includesNormalized(item.label, sector.key)
      ) ||
      (job.themes ?? []).some((item) =>
        includesNormalized(item.label, sector.key)
      );
    if (sectorMatch) {
      score += sector.weight * 9;
      reasons.add('Dans un secteur qui ressort de ton profil');
    }
  }

  for (const skill of signals.skills) {
    if (includesNormalized(text, skill.key)) {
      score += skill.weight * 5;
      reasons.add('Mobilise des forces ou compétences proches des tiennes');
    }
  }

  for (const condition of signals.workConditions) {
    if (includesNormalized(text, condition.key)) {
      score += condition.weight * 5;
      reasons.add('Compatible avec ton style ou tes conditions de travail');
    }
  }

  if (job.transitions?.digital) score += 2;
  if (job.transitions?.ecological) score += 2;
  if ((job.skills ?? []).some((skill) => skill.isMain)) score += 2;

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
    minScore: 15,
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
    minScore: 15,
  });

  return matching.jobs;
}
