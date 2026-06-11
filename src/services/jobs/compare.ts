import { Types } from 'mongoose';

import { BilanCompetence } from '@/models/BilanCompetence';
import { RomeMarketStat } from '@/models/RomeMarketStat';
import { RomeMetier } from '@/models/RomeMetier';
import { normalizeText } from '@/services/rome/utils';
import { mapSubdomainsToLabels } from '@/utils/bilanLabelMapper';
import { HttpError } from '@/utils/httpError';

const MIN_COMPARE_JOBS = 2;
const MAX_COMPARE_JOBS = 3;

type SkillLike = {
  label: string;
  type?: string;
  isMain?: boolean;
  source?: string;
};

type WorkContextLike = {
  label: string;
  category?: string;
};

type MarketStatLike = Awaited<ReturnType<typeof getLatestMarketStats>>[number];

export interface ComparedJob {
  id: string;
  code: string;
  title: string;
  sector: string | undefined;
  description: string | undefined;
  matchScore: number;
  matchReasons: string[];
  riasec: string[];
  matchedInterests: string[];
  matchedSkills: string[];
  skillsToDevelop: string[];
  matchedWorkConditions: string[];
  workContexts: string[];
  accessToJob: string | undefined;
  isRegulated: boolean | undefined;
  isExecutive: boolean | undefined;
  market: ReturnType<typeof formatMarketStats>;
  recommendedNextStep: string;
}

export interface JobComparisonResult {
  jobs: ComparedJob[];
  context: {
    bilanId: string;
    bilanVersion: number;
    interestsProfile: string[];
    strengths: string[];
    workConditions: string[];
  };
}

function assertComparableJobIds(jobIds: string[]) {
  const uniqueIds = [...new Set(jobIds)];

  if (uniqueIds.length !== jobIds.length) {
    throw new HttpError(400, 'Duplicate job ids are not allowed');
  }

  if (
    uniqueIds.length < MIN_COMPARE_JOBS ||
    uniqueIds.length > MAX_COMPARE_JOBS
  ) {
    throw new HttpError(
      400,
      `Compare between ${MIN_COMPARE_JOBS} and ${MAX_COMPARE_JOBS} jobs`
    );
  }
}

function getLabels(items: Array<{ label?: string }> = []) {
  return items
    .map((item) => item.label)
    .filter((label): label is string => Boolean(label));
}

function matchLabels(source: string[], targets: string[]) {
  const normalizedTargets = targets.map(normalizeText).filter(Boolean);

  return source.filter((label) => {
    const normalizedLabel = normalizeText(label);
    return normalizedTargets.some(
      (target) =>
        normalizedLabel.includes(target) || target.includes(normalizedLabel)
    );
  });
}

function buildSkillsToDevelop(skills: SkillLike[], matchedSkills: string[]) {
  const matched = new Set(matchedSkills.map(normalizeText));

  return skills
    .filter((skill) => skill.isMain !== false)
    .map((skill) => skill.label)
    .filter((label) => !matched.has(normalizeText(label)))
    .slice(0, 5);
}

function computeMatchScore({
  matchedInterests,
  matchedSkills,
  matchedWorkConditions,
}: {
  matchedInterests: string[];
  matchedSkills: string[];
  matchedWorkConditions: string[];
}) {
  return Math.min(
    100,
    Math.round(
      matchedInterests.length * 45 +
        Math.min(matchedSkills.length, 5) * 8 +
        Math.min(matchedWorkConditions.length, 3) * 5
    )
  );
}

function buildMatchReasons({
  matchedInterests,
  matchedSkills,
  matchedWorkConditions,
}: {
  matchedInterests: string[];
  matchedSkills: string[];
  matchedWorkConditions: string[];
}) {
  const reasons: string[] = [];

  if (matchedInterests.length > 0) {
    reasons.push('Compatible avec ton profil d’intérêts');
  }
  if (matchedSkills.length > 0) {
    reasons.push('Mobilise des compétences proches de ton profil');
  }
  if (matchedWorkConditions.length > 0) {
    reasons.push('Compatible avec tes conditions de travail idéales');
  }

  if (reasons.length === 0) {
    reasons.push('Piste à explorer avec prudence par rapport à ton profil');
  }

  return reasons;
}

function buildRecommendedNextStep({
  skillsToDevelop,
  market,
  accessToJob,
}: {
  skillsToDevelop: string[];
  market: ReturnType<typeof formatMarketStats>;
  accessToJob?: string;
}) {
  if (skillsToDevelop.length > 0) {
    return `Explorer les formations ou projets permettant de développer : ${skillsToDevelop
      .slice(0, 2)
      .join(', ')}.`;
  }

  if (market?.tension) {
    return 'Vérifier les opportunités locales et confronter cette piste au marché actuel.';
  }

  if (accessToJob) {
    return 'Lire les conditions d’accès au métier et identifier les prérequis à valider.';
  }

  return 'Approfondir la fiche métier et échanger avec un professionnel du secteur.';
}

function formatMarketStats(market: MarketStatLike | undefined) {
  if (!market) return null;

  return {
    territory: market.territory,
    salary: market.salary,
    offers: market.offers,
    hires: market.hires,
    demanders: market.demanders,
    tension: market.tension,
    lastSyncedAt: market.lastSyncedAt,
  };
}

async function getLatestMarketStats(jobIds: Types.ObjectId[]) {
  return RomeMarketStat.find({ metierId: { $in: jobIds } })
    .sort({ lastSyncedAt: -1 })
    .select('-raw -__v')
    .lean();
}

export async function compareJobsForUser(
  userId: string,
  jobIds: string[]
): Promise<JobComparisonResult> {
  assertComparableJobIds(jobIds);

  const bilan = await BilanCompetence.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!bilan) {
    throw new HttpError(404, 'No bilan found');
  }

  const objectIds = jobIds.map((id) => new Types.ObjectId(id));
  const jobs = await RomeMetier.find({
    _id: { $in: objectIds },
    isActive: true,
  })
    .select(
      '_id code label definition domain riasec skills workContexts accessToJob isRegulated isExecutive'
    )
    .lean();

  if (jobs.length !== jobIds.length) {
    throw new HttpError(404, 'One or more jobs were not found');
  }

  const marketStats = await getLatestMarketStats(jobs.map((job) => job._id));
  const marketByJobId = new Map(
    marketStats.map((market) => [market.metierId.toString(), market])
  );

  const strengths = [
    ...bilan.investigation.competence.strengths,
    ...bilan.investigation.softSkills.strengths,
  ];
  const mappedStrengths = [
    ...mapSubdomainsToLabels(
      'competence',
      bilan.investigation.competence.strengths
    ),
    ...mapSubdomainsToLabels(
      'soft_skill',
      bilan.investigation.softSkills.strengths
    ),
  ];
  const mappedWorkConditions = mapSubdomainsToLabels(
    'work_condition',
    bilan.investigation.topWorkConditions
  );

  const comparedJobs: ComparedJob[] = jobs.map((job) => {
    const skillLabels = getLabels(job.skills);
    const workContextLabels = getLabels(job.workContexts);
    const matchedInterests = job.riasec.codes.filter((code) =>
      bilan.investigation.interestsProfile.includes(code)
    );
    const matchedSkills = matchLabels(skillLabels, [
      ...strengths,
      ...mappedStrengths,
    ]);
    const matchedWorkConditions = matchLabels(workContextLabels, [
      ...bilan.investigation.topWorkConditions,
      ...mappedWorkConditions,
    ]);
    const skillsToDevelop = buildSkillsToDevelop(job.skills, matchedSkills);
    const market = formatMarketStats(marketByJobId.get(job._id.toString()));

    return {
      id: job._id.toString(),
      code: job.code,
      title: job.label,
      sector: job.domain?.label ?? job.domain?.grandDomain?.label,
      description: job.definition,
      matchScore: computeMatchScore({
        matchedInterests,
        matchedSkills,
        matchedWorkConditions,
      }),
      matchReasons: buildMatchReasons({
        matchedInterests,
        matchedSkills,
        matchedWorkConditions,
      }),
      riasec: job.riasec.codes,
      matchedInterests,
      matchedSkills,
      skillsToDevelop,
      matchedWorkConditions,
      workContexts: workContextLabels,
      accessToJob: job.accessToJob,
      isRegulated: job.isRegulated,
      isExecutive: job.isExecutive,
      market,
      recommendedNextStep: buildRecommendedNextStep({
        skillsToDevelop,
        market,
        accessToJob: job.accessToJob,
      }),
    };
  });

  const byRequestedOrder = new Map(
    comparedJobs.map((job) => [job.id, job] as const)
  );

  return {
    jobs: jobIds
      .map((id) => byRequestedOrder.get(id))
      .filter((job): job is ComparedJob => Boolean(job)),
    context: {
      bilanId: bilan._id.toString(),
      bilanVersion: bilan.version,
      interestsProfile: bilan.investigation.interestsProfile,
      strengths: mappedStrengths,
      workConditions: mappedWorkConditions,
    },
  };
}
