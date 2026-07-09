import { Types } from 'mongoose';

import { Swipe } from '@/models/Swipe';

export interface TopLikedJobSummary {
  id: string;
  code: string;
  title: string;
  sector?: string;
  description?: string;
  growthOutlook: 'unknown';
  tags: string[];
  riasec: string[];
  likesCount: number;
  lastLikedAt: Date;
}

interface AggregatedLikedJob {
  _id: Types.ObjectId;
  code: string;
  label: string;
  definition?: string;
  domain?: {
    label?: string;
    grandDomain?: {
      label?: string;
    };
  };
  themes?: Array<{ label?: string }>;
  sectors?: Array<{ label?: string }>;
  riasec?: {
    codes?: string[];
  };
  likesCount: number;
  lastLikedAt: Date;
}

function formatTopLikedJob(job: AggregatedLikedJob): TopLikedJobSummary {
  return {
    id: job._id.toString(),
    code: job.code,
    title: job.label,
    sector: job.domain?.label ?? job.domain?.grandDomain?.label,
    description: job.definition,
    growthOutlook: 'unknown',
    tags: [
      ...(job.themes ?? []).map((theme) => theme.label),
      ...(job.sectors ?? []).map((sector) => sector.label),
    ].filter((tag): tag is string => Boolean(tag)),
    riasec: job.riasec?.codes ?? [],
    likesCount: job.likesCount,
    lastLikedAt: job.lastLikedAt,
  };
}

export async function getTopLikedJobsForUser(
  userId: string,
  limit = 3
): Promise<TopLikedJobSummary[]> {
  const safeLimit = Math.max(1, Math.min(limit, 10));

  const jobs = await Swipe.aggregate<AggregatedLikedJob>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        action: 'like',
      },
    },
    {
      $group: {
        _id: '$jobId',
        likesCount: { $sum: 1 },
        lastLikedAt: { $max: '$swipedAt' },
      },
    },
    { $sort: { likesCount: -1, lastLikedAt: -1 } },
    { $limit: safeLimit },
    {
      $lookup: {
        from: 'romemetiers',
        localField: '_id',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: '$job' },
    { $match: { 'job.isActive': true } },
    {
      $project: {
        _id: '$job._id',
        code: '$job.code',
        label: '$job.label',
        definition: '$job.definition',
        domain: '$job.domain',
        themes: '$job.themes',
        sectors: '$job.sectors',
        riasec: '$job.riasec',
        likesCount: 1,
        lastLikedAt: 1,
      },
    },
  ]);

  return jobs.map(formatTopLikedJob);
}
