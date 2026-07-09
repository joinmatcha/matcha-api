import { Types } from 'mongoose';

import {
  BilanCompetence,
  BilanCompetenceDocument,
} from '@/models/BilanCompetence';
import PersonalityTest from '@/models/PersonalityTest';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import {
  TopLikedJobSummary,
  getTopLikedJobsForUser,
} from '@/services/jobs/topLiked';
import { computePreferences } from '@/services/users/preferences';
import { mapSubdomainsToLabels } from '@/utils/bilanLabelMapper';

type MatchaProfileRoute =
  | 'BilanIntro'
  | 'PersonalityIntro'
  | 'WorkStyleIntro'
  | 'JobCompare'
  | 'CareerPreferences';

interface MatchaProfileSignal {
  label: string;
  sources: string[];
  weight: number;
}

interface MatchaProfileJob {
  id: string;
  title: string;
  sector?: string;
  description?: string;
  score?: number;
  likesCount?: number;
}

interface MatchaProfileTestCard {
  key: 'bilan' | 'personality' | 'work_style';
  label: string;
  title: string;
  description: string;
  completed: boolean;
}

interface MatchaProfileNextAction {
  type:
    | 'start_bilan'
    | 'start_personality'
    | 'start_work_style'
    | 'compare_jobs'
    | 'view_liked_jobs';
  label: string;
  route: MatchaProfileRoute;
  jobIds?: string[];
}

export interface MatchaProfileSummary {
  completion: number;
  mainProfile: {
    title: string;
    summary: string;
  };
  completedTests: {
    total: number;
    bilan: boolean;
    personality: boolean;
    workStyle: boolean;
  };
  strongSignals: MatchaProfileSignal[];
  keyDimensions: {
    strengths: string[];
    values: string[];
    environments: string[];
    sectors: string[];
  };
  tests: MatchaProfileTestCard[];
  recommendedJobs: MatchaProfileJob[];
  likedJobs: MatchaProfileJob[];
  nextBestAction: MatchaProfileNextAction;
}

interface BilanLike {
  conclusion: BilanCompetenceDocument['conclusion'];
  investigation: BilanCompetenceDocument['investigation'];
}

interface PersonalityLike {
  result: string;
  type: string;
  description?: string;
  traits?: string[];
}

interface WorkStyleLike {
  topAxes?: string[];
  profile?: {
    title: string;
    description: string;
    strengths?: string[];
  };
}

const WORK_STYLE_AXIS_LABELS: Record<string, string> = {
  autonomy: 'Autonomie',
  collaboration: 'Collaboration',
  pace: 'Rythme',
  structure: 'Structure',
  variety: 'Variété',
  human_contact: 'Contact humain',
  mobility: 'Mobilité',
  learning: 'Apprentissage',
};

function unique(values: Array<string | null | undefined>, limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values) {
    const value = rawValue?.trim();
    if (!value) continue;

    const key = value.toLocaleLowerCase('fr-FR');
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function humanizeWorkStyleAxis(axis: string): string {
  return WORK_STYLE_AXIS_LABELS[axis] ?? axis.replace(/_/g, ' ');
}

function computeMatchaCompletion({
  hasBilan,
  hasPersonality,
  hasWorkStyle,
}: {
  hasBilan: boolean;
  hasPersonality: boolean;
  hasWorkStyle: boolean;
}): number {
  const checks = [hasBilan, hasPersonality, hasWorkStyle];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function addSignals(
  map: Map<string, MatchaProfileSignal>,
  source: string,
  values: string[],
  weight = 1
) {
  for (const value of values) {
    const label = value.trim();
    if (!label) continue;

    const key = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr-FR');
    const current = map.get(key);

    if (!current) {
      map.set(key, { label, sources: [source], weight });
      continue;
    }

    if (!current.sources.includes(source)) current.sources.push(source);
    current.weight += weight;
  }
}

function buildStrongSignals({
  bilan,
  personality,
  workStyle,
  preferences,
}: {
  bilan: BilanLike | null;
  personality: PersonalityLike | null;
  workStyle: WorkStyleLike | null;
  preferences: Awaited<ReturnType<typeof computePreferences>>;
}) {
  const signals = new Map<string, MatchaProfileSignal>();
  const workStyleAxes = (workStyle?.topAxes ?? []).map(humanizeWorkStyleAxis);

  addSignals(
    signals,
    'Auto-évaluation',
    bilan?.conclusion.keyStrengths ?? [],
    2
  );
  addSignals(signals, 'Personnalité', personality?.traits ?? [], 1.5);
  addSignals(signals, 'Style professionnel', workStyleAxes, 1.4);
  addSignals(
    signals,
    'Métiers aimés',
    [
      ...preferences.topCompetences.map((item) => item.key),
      ...preferences.topWorkConditions.map((item) => item.key),
    ],
    1
  );

  return [...signals.values()]
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        b.sources.length - a.sources.length ||
        a.label.localeCompare(b.label)
    )
    .slice(0, 5);
}

function formatRecommendedJobs(bilan: BilanLike | null): MatchaProfileJob[] {
  return (bilan?.conclusion.recommendedJobs ?? []).slice(0, 3).map((job) => ({
    id: job.id,
    title: job.title,
    sector: job.sector,
    description: job.description,
    score: job.score,
  }));
}

function formatLikedJobs(jobs: TopLikedJobSummary[]): MatchaProfileJob[] {
  return jobs.slice(0, 3).map((job) => ({
    id: job.id,
    title: job.title,
    sector: job.sector,
    description: job.description,
    likesCount: job.likesCount,
  }));
}

function buildNextAction({
  hasBilan,
  hasPersonality,
  hasWorkStyle,
  recommendedJobs,
}: {
  hasBilan: boolean;
  hasPersonality: boolean;
  hasWorkStyle: boolean;
  recommendedJobs: MatchaProfileJob[];
}): MatchaProfileNextAction {
  if (!hasBilan) {
    return {
      type: 'start_bilan',
      label: "Commencer l'auto-évaluation",
      route: 'BilanIntro',
    };
  }

  if (!hasPersonality) {
    return {
      type: 'start_personality',
      label: 'Faire le test personnalité',
      route: 'PersonalityIntro',
    };
  }

  if (!hasWorkStyle) {
    return {
      type: 'start_work_style',
      label: 'Découvrir mon style pro',
      route: 'WorkStyleIntro',
    };
  }

  const jobIds = recommendedJobs.map((job) => job.id).filter(Boolean);
  if (jobIds.length >= 2) {
    return {
      type: 'compare_jobs',
      label: 'Comparer mes métiers',
      route: 'JobCompare',
      jobIds: jobIds.slice(0, 3),
    };
  }

  return {
    type: 'view_liked_jobs',
    label: 'Voir mes métiers favoris',
    route: 'CareerPreferences',
  };
}

async function getPersonalityForUser({
  userId,
  personalityTestId,
}: {
  userId: string;
  personalityTestId?: unknown;
}): Promise<PersonalityLike | null> {
  if (personalityTestId) {
    const linkedPersonality = await PersonalityTest.findById(
      personalityTestId as Types.ObjectId | string
    ).lean<PersonalityLike | null>();

    if (linkedPersonality) return linkedPersonality;
  }

  return PersonalityTest.findOne({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean<PersonalityLike | null>();
}

function buildProfileSummary({
  bilan,
  personality,
  workStyle,
  strengths,
}: {
  bilan: BilanLike | null;
  personality: PersonalityLike | null;
  workStyle: WorkStyleLike | null;
  strengths: string[];
}): string {
  const topStrengths = strengths.slice(0, 2);

  if (bilan) {
    if (topStrengths.length > 0) {
      return `Ton profil fait surtout ressortir ${topStrengths.join(' et ')}. Matcha croise ces signaux avec tes tests et tes métiers aimés.`;
    }

    return 'Ton auto-évaluation donne déjà une base solide. Matcha la croise avec tes autres résultats et tes métiers aimés.';
  }

  if (personality) {
    return "Ta personnalité donne déjà un premier signal. Complète l'auto-évaluation pour relier ce fonctionnement à des métiers concrets.";
  }

  if (workStyle) {
    return 'Ton style professionnel indique les environnements où tu avances le mieux. Ajoute les autres tests pour obtenir une synthèse plus fiable.';
  }

  return 'Commence les analyses pour construire une synthèse fiable de tes forces, de ton style et de tes pistes métier.';
}

export async function buildMatchaProfile(
  userId: string
): Promise<MatchaProfileSummary | null> {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const userObjectId = new Types.ObjectId(userId);
  const [bilan, personality, workStyle, preferences, topLikedJobs] =
    await Promise.all([
      BilanCompetence.findOne({ user: userObjectId })
        .sort({ createdAt: -1 })
        .lean<BilanLike | null>(),
      getPersonalityForUser({
        userId,
        personalityTestId: user.personalityTestId,
      }),
      WorkStyleResult.findOne({ user: userObjectId })
        .sort({ createdAt: -1 })
        .lean<WorkStyleLike | null>(),
      computePreferences(userId),
      getTopLikedJobsForUser(userId, 5),
    ]);

  const hasBilan = Boolean(bilan);
  const hasPersonality = Boolean(personality);
  const hasWorkStyle = Boolean(workStyle);

  const workStyleAxes = (workStyle?.topAxes ?? []).map(humanizeWorkStyleAxis);
  const strengths = unique([
    ...(bilan?.conclusion.keyStrengths ?? []),
    ...mapSubdomainsToLabels(
      'competence',
      bilan?.investigation.competence.strengths ?? []
    ),
    ...mapSubdomainsToLabels(
      'soft_skill',
      bilan?.investigation.softSkills.strengths ?? []
    ),
    ...(personality?.traits ?? []),
  ]);
  const values = unique([
    ...mapSubdomainsToLabels('value', bilan?.investigation.topValues ?? []),
    ...preferences.topTags.map((item) => item.key),
  ]);
  const environments = unique([
    ...(bilan?.conclusion.recommendedEnvironments ?? []),
    ...mapSubdomainsToLabels(
      'work_condition',
      bilan?.investigation.topWorkConditions ?? []
    ),
    ...workStyleAxes,
    ...preferences.topWorkConditions.map((item) => item.key),
  ]);
  const sectors = unique(
    preferences.topSectors.map((item) => item.key),
    5
  );

  const recommendedJobs = formatRecommendedJobs(bilan);
  const likedJobs = formatLikedJobs(topLikedJobs);
  const completedCount = [hasBilan, hasPersonality, hasWorkStyle].filter(
    Boolean
  ).length;
  const mainTitle =
    bilan?.conclusion.archetype.title ??
    personality?.result ??
    workStyle?.profile?.title ??
    'Profil en construction';
  const summary = buildProfileSummary({
    bilan,
    personality,
    workStyle,
    strengths,
  });

  return {
    completion: computeMatchaCompletion({
      hasBilan,
      hasPersonality,
      hasWorkStyle,
    }),
    mainProfile: {
      title: mainTitle,
      summary,
    },
    completedTests: {
      total: completedCount,
      bilan: hasBilan,
      personality: hasPersonality,
      workStyle: hasWorkStyle,
    },
    strongSignals: buildStrongSignals({
      bilan,
      personality,
      workStyle,
      preferences,
    }),
    keyDimensions: {
      strengths,
      values,
      environments,
      sectors,
    },
    tests: [
      {
        key: 'bilan',
        label: 'Auto-évaluation',
        title: bilan?.conclusion.archetype.title ?? 'À compléter',
        description: hasBilan
          ? 'Forces, valeurs, environnements et métiers recommandés.'
          : 'Le socle principal pour comprendre tes pistes métier.',
        completed: hasBilan,
      },
      {
        key: 'personality',
        label: 'Personnalité',
        title: personality?.result ?? 'À compléter',
        description: hasPersonality
          ? 'Énergie, préférences naturelles et points d’attention.'
          : 'Utile pour préciser ton fonctionnement naturel.',
        completed: hasPersonality,
      },
      {
        key: 'work_style',
        label: 'Style professionnel',
        title: workStyle?.profile?.title ?? 'À compléter',
        description: hasWorkStyle
          ? 'Cadre de travail, rythme et conditions favorables.'
          : 'Ajoute un signal de compatibilité sur les métiers.',
        completed: hasWorkStyle,
      },
    ],
    recommendedJobs,
    likedJobs,
    nextBestAction: buildNextAction({
      hasBilan,
      hasPersonality,
      hasWorkStyle,
      recommendedJobs,
    }),
  };
}
