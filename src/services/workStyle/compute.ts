import { Types } from 'mongoose';

import User from '@/models/User';
import {
  WorkStyleDimension,
  WorkStyleQuestion,
  WorkStyleQuestionDocument,
} from '@/models/WorkStyleQuestion';
import { WorkStyleResult, WorkStyleScores } from '@/models/WorkStyleResult';
import {
  WorkStyleProfileDefinition,
  WorkStyleVersion,
} from '@/models/WorkStyleVersion';
import { HttpError } from '@/utils/httpError';

export type WorkStyleAnswerInput = {
  questionId: string;
  value: number;
};

export type WorkStyleCompatibility = {
  level: 'high' | 'medium' | 'low';
  label: string;
  reasons: string[];
};

const dimensions: WorkStyleDimension[] = [
  'autonomy',
  'collaboration',
  'pace',
  'structure',
  'variety',
  'human_contact',
  'mobility',
  'learning',
];

const dimensionLabels: Record<WorkStyleDimension, string> = {
  autonomy: 'Autonomie',
  collaboration: 'Collaboration',
  pace: 'Rythme',
  structure: 'Structure',
  variety: 'Variété',
  human_contact: 'Contact humain',
  mobility: 'Terrain',
  learning: 'Apprentissage',
};

const fallbackProfile: WorkStyleProfileDefinition = {
  key: 'balanced',
  title: 'Style équilibré',
  description:
    'Ton profil montre un équilibre entre plusieurs façons de travailler.',
  strengths: [
    'Adaptation',
    'Souplesse',
    'Capacité à composer avec le contexte',
  ],
  cautions: ['Clarifie ce qui compte le plus pour toi avant de choisir.'],
  advice: ['Compare les environnements de travail autant que les missions.'],
  preferredAxes: [],
};

export const serializeWorkStyleVersion = async (versionDoc: {
  _id: Types.ObjectId | string;
  version: number;
  title: string;
  summary?: string;
  isActive: boolean;
  status?: string;
  profiles: WorkStyleProfileDefinition[];
}) => {
  const questions = await WorkStyleQuestion.find({
    versionId: versionDoc._id,
    isActive: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return {
    _id: versionDoc._id.toString(),
    version: versionDoc.version,
    title: versionDoc.title,
    summary: versionDoc.summary,
    isActive: versionDoc.isActive,
    status: versionDoc.status,
    profiles: versionDoc.profiles,
    questions: questions.map((question) => ({
      id: question.code,
      text: question.text,
      dimension: question.dimension,
      polarity: question.polarity,
      order: question.order,
    })),
  };
};

export const getActiveWorkStyleVersion = async () => {
  const active = await WorkStyleVersion.findOne({
    isActive: true,
    status: 'active',
  }).lean();

  if (!active) return null;
  return serializeWorkStyleVersion(active);
};

function initializeScores(): WorkStyleScores {
  return dimensions.reduce((acc, dimension) => {
    acc[dimension] = 0;
    return acc;
  }, {} as WorkStyleScores);
}

function normalizeAnswers(
  answers: WorkStyleAnswerInput[],
  questions: WorkStyleQuestionDocument[]
) {
  const questionsByCode = new Map(
    questions.map((question) => [question.code, question])
  );
  const totals = initializeScores();
  const counts = initializeScores();

  for (const answer of answers) {
    const question = questionsByCode.get(answer.questionId);
    if (!question) continue;

    const centered = (answer.value - 3) * question.polarity;
    totals[question.dimension] += centered;
    counts[question.dimension] += 1;
  }

  return dimensions.reduce((acc, dimension) => {
    const count = counts[dimension] || 1;
    const average = totals[dimension] / count;
    acc[dimension] = Math.round(((average + 2) / 4) * 100);
    return acc;
  }, {} as WorkStyleScores);
}

function pickProfile(
  scores: WorkStyleScores,
  profiles: WorkStyleProfileDefinition[]
) {
  const ranked = dimensions
    .map((dimension) => ({ dimension, score: scores[dimension] }))
    .sort((a, b) => b.score - a.score);
  const topAxes = ranked.slice(0, 3).map((item) => item.dimension);

  const scoredProfiles = profiles.map((profile) => ({
    profile,
    score: profile.preferredAxes.reduce(
      (sum, axis) => sum + (scores[axis as WorkStyleDimension] ?? 0),
      0
    ),
  }));

  const best =
    scoredProfiles.sort((a, b) => b.score - a.score)[0]?.profile ??
    fallbackProfile;

  return { profile: best, topAxes };
}

export const computeWorkStyle = async (
  userId: string,
  answers: WorkStyleAnswerInput[]
) => {
  const version = await WorkStyleVersion.findOne({
    isActive: true,
    status: 'active',
  });

  if (!version) {
    throw new HttpError(404, 'Aucun test Style professionnel actif trouvé');
  }

  const questions = await WorkStyleQuestion.find({
    versionId: version._id,
    isActive: true,
  });

  if (questions.length === 0) {
    throw new HttpError(404, 'Aucune question active trouvée');
  }

  const answeredQuestionIds = new Set(
    answers.map((answer) => answer.questionId)
  );
  const missing = questions.filter(
    (question) => !answeredQuestionIds.has(question.code)
  );

  if (missing.length > 0) {
    throw new HttpError(400, 'Toutes les questions doivent être complétées');
  }

  const scores = normalizeAnswers(answers, questions);
  const { profile, topAxes } = pickProfile(scores, version.profiles);

  const result = await WorkStyleResult.create({
    user: userId,
    versionId: version._id,
    version: version.version,
    answers,
    scores,
    topAxes,
    profile: {
      key: profile.key,
      title: profile.title,
      description: profile.description,
      strengths: profile.strengths,
      cautions: profile.cautions,
      advice: profile.advice,
    },
  });

  await User.findByIdAndUpdate(userId, { workStyleResultId: result._id });

  return serializeWorkStyleResult(result);
};

export const serializeWorkStyleResult = (result: {
  _id: Types.ObjectId | string;
  version: number;
  scores: WorkStyleScores;
  topAxes: WorkStyleDimension[];
  profile: {
    key: string;
    title: string;
    description: string;
    strengths: string[];
    cautions: string[];
    advice: string[];
  };
  createdAt?: Date;
}) => ({
  id: result._id.toString(),
  version: result.version,
  scores: result.scores,
  topAxes: result.topAxes,
  topAxisLabels: result.topAxes.map((axis) => dimensionLabels[axis]),
  profile: result.profile,
  createdAt: result.createdAt?.toISOString(),
});

export async function getLatestWorkStyleResult(userId: string) {
  const result = await WorkStyleResult.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return result ? serializeWorkStyleResult(result) : null;
}

export async function getWorkStyleHistory(userId: string) {
  const results = await WorkStyleResult.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return results.map(serializeWorkStyleResult);
}

export async function resetUserWorkStyle(userId: string) {
  await Promise.all([
    WorkStyleResult.deleteMany({ user: userId }),
    User.findByIdAndUpdate(userId, { $unset: { workStyleResultId: 1 } }),
  ]);
}

export function computeWorkStyleCompatibility(
  workStyle: Awaited<ReturnType<typeof getLatestWorkStyleResult>>,
  job: {
    workContexts?: Array<{ label?: string; category?: string }>;
    skills?: Array<{ label?: string }>;
    domain?: { label?: string; grandDomain?: { label?: string } };
  }
): WorkStyleCompatibility | null {
  if (!workStyle) return null;

  const text = [
    ...(job.workContexts ?? []).map((item) => item.label),
    ...(job.workContexts ?? []).map((item) => item.category),
    ...(job.skills ?? []).map((item) => item.label),
    job.domain?.label,
    job.domain?.grandDomain?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const reasons: string[] = [];
  let score = 0;

  const hasTopAxis = (axis: WorkStyleDimension) =>
    workStyle.topAxes.includes(axis);

  if (
    hasTopAxis('human_contact') &&
    /client|public|accompagn|conseil|relation/.test(text)
  ) {
    score += 2;
    reasons.push('Le métier semble proposer du contact humain.');
  }
  if (
    hasTopAxis('mobility') &&
    /terrain|déplacement|chantier|site|extérieur/.test(text)
  ) {
    score += 2;
    reasons.push('Le contexte paraît compatible avec un besoin de terrain.');
  }
  if (
    hasTopAxis('structure') &&
    /procédure|sécurité|contrôle|règle|qualité/.test(text)
  ) {
    score += 2;
    reasons.push('Le métier semble offrir un cadre structuré.');
  }
  if (
    hasTopAxis('learning') &&
    /formation|veille|analyse|développement|innovation/.test(text)
  ) {
    score += 2;
    reasons.push('Le métier peut soutenir ton besoin d’apprentissage.');
  }
  if (
    hasTopAxis('collaboration') &&
    /équipe|coordination|partenaire|collabor/.test(text)
  ) {
    score += 1;
    reasons.push('Le travail paraît impliquer de la coopération.');
  }
  if (hasTopAxis('variety') && /polyval|projet|divers|vari/.test(text)) {
    score += 1;
    reasons.push('Les missions semblent variées.');
  }

  if (reasons.length === 0) {
    return {
      level: 'low',
      label: 'À vérifier avec ton style professionnel',
      reasons: [
        'Les données disponibles ne montrent pas encore de compatibilité forte.',
      ],
    };
  }

  const level = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';

  return {
    level,
    label:
      level === 'high'
        ? 'Compatible avec ton style professionnel'
        : level === 'medium'
          ? 'Plutôt compatible avec ton style professionnel'
          : 'À vérifier avec ton style professionnel',
    reasons: reasons.slice(0, 3),
  };
}
