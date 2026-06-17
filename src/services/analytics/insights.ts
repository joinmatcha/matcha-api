import { FilterQuery } from 'mongoose';

import {
  AnalyticsEvent,
  AnalyticsEventDocument,
} from '@/models/AnalyticsEvent';
import { BilanCompetence } from '@/models/BilanCompetence';
import { WorkStyleResult } from '@/models/WorkStyleResult';

export type InsightsDateRange = {
  from?: Date;
  to?: Date;
  limit?: number;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function clampLimit(limit?: number) {
  return Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function eventDateMatch(range: InsightsDateRange = {}) {
  const receivedAt: Record<string, Date> = {};
  if (range.from) receivedAt.$gte = range.from;
  if (range.to) receivedAt.$lte = range.to;

  return Object.keys(receivedAt).length
    ? ({ receivedAt } as FilterQuery<AnalyticsEventDocument>)
    : {};
}

function createdAtMatch(range: InsightsDateRange = {}) {
  const createdAt: Record<string, Date> = {};
  if (range.from) createdAt.$gte = range.from;
  if (range.to) createdAt.$lte = range.to;
  return Object.keys(createdAt).length ? { createdAt } : {};
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function testLabel(entityType?: string | null) {
  const labels: Record<string, string> = {
    personality: 'Test de personnalité',
    bilan: 'Auto-évaluation professionnelle',
    work_style: 'Style professionnel',
  };
  return entityType ? (labels[entityType] ?? entityType) : 'Inconnu';
}

export async function getInsightsOverview(range: InsightsDateRange = {}) {
  const match = eventDateMatch(range);

  const [totalEvents, activeUsers, started, completed, jobViews, swipes] =
    await Promise.all([
      AnalyticsEvent.countDocuments(match),
      AnalyticsEvent.distinct('userHash', match),
      AnalyticsEvent.countDocuments({ ...match, eventType: 'test_started' }),
      AnalyticsEvent.countDocuments({ ...match, eventType: 'test_completed' }),
      AnalyticsEvent.countDocuments({ ...match, eventType: 'job_viewed' }),
      AnalyticsEvent.aggregate([
        { $match: { ...match, eventType: 'job_swiped' } },
        {
          $group: {
            _id: '$metadata.action',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const swipeCounts = swipes.reduce<Record<string, number>>((acc, item) => {
    if (typeof item._id === 'string') acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalEvents,
    activeUsers: activeUsers.length,
    testsStarted: started,
    testsCompleted: completed,
    completionRate: percentage(completed, started),
    jobViews,
    likes: swipeCounts.like ?? 0,
    dislikes: swipeCounts.dislike ?? 0,
  };
}

export async function getInsightsActivity(range: InsightsDateRange = {}) {
  const match = eventDateMatch(range);

  return AnalyticsEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
        },
        events: { $sum: 1 },
        users: { $addToSet: '$userHash' },
        testsCompleted: {
          $sum: { $cond: [{ $eq: ['$eventType', 'test_completed'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        day: '$_id.day',
        events: 1,
        activeUsers: { $size: '$users' },
        testsCompleted: 1,
      },
    },
    { $sort: { day: 1 } },
  ]);
}

export async function getInsightsTests(range: InsightsDateRange = {}) {
  const match = eventDateMatch(range);

  const [counts, abandonSteps] = await Promise.all([
    AnalyticsEvent.aggregate([
      {
        $match: {
          ...match,
          entityType: { $in: ['personality', 'bilan', 'work_style'] },
          eventType: {
            $in: ['test_started', 'test_completed', 'test_abandoned'],
          },
        },
      },
      {
        $group: {
          _id: '$entityType',
          started: {
            $sum: { $cond: [{ $eq: ['$eventType', 'test_started'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$eventType', 'test_completed'] }, 1, 0] },
          },
          abandoned: {
            $sum: { $cond: [{ $eq: ['$eventType', 'test_abandoned'] }, 1, 0] },
          },
        },
      },
    ]),
    AnalyticsEvent.aggregate([
      {
        $match: {
          ...match,
          eventType: 'test_abandoned',
          entityType: { $in: ['personality', 'bilan', 'work_style'] },
        },
      },
      {
        $group: {
          _id: {
            entityType: '$entityType',
            stepId: '$stepId',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: '$_id.entityType',
          stepId: { $first: '$_id.stepId' },
          count: { $first: '$count' },
        },
      },
    ]),
  ]);

  const stepsByTest = new Map(
    abandonSteps.map((item) => [
      item._id,
      { stepId: item.stepId ?? null, count: item.count },
    ])
  );

  return counts.map((item) => ({
    entityType: item._id,
    label: testLabel(item._id),
    started: item.started,
    completed: item.completed,
    abandoned: item.abandoned,
    completionRate: percentage(item.completed, item.started),
    abandonmentRate: percentage(item.abandoned, item.started),
    topAbandonStep: stepsByTest.get(item._id) ?? null,
  }));
}

async function topJobEvents(
  eventType: 'job_matched' | 'job_viewed' | 'job_swiped',
  range: InsightsDateRange,
  limit: number,
  action?: 'like' | 'dislike'
) {
  const metadataActionMatch = action ? { 'metadata.action': action } : {};

  return AnalyticsEvent.aggregate([
    {
      $match: {
        ...eventDateMatch(range),
        eventType,
        entityType: 'job',
        entityId: { $exists: true, $ne: null },
        ...metadataActionMatch,
      },
    },
    {
      $group: {
        _id: '$entityId',
        count: { $sum: 1 },
        title: { $first: '$metadata.jobTitle' },
        domain: { $first: '$metadata.domain' },
      },
    },
    { $sort: { count: -1, title: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        jobId: '$_id',
        title: { $ifNull: ['$title', 'Métier inconnu'] },
        domain: { $ifNull: ['$domain', 'Domaine inconnu'] },
        count: 1,
      },
    },
  ]);
}

async function topDomains(
  eventType: 'job_matched' | 'job_viewed' | 'job_swiped',
  range: InsightsDateRange,
  limit: number,
  action?: 'like' | 'dislike'
) {
  const metadataActionMatch = action ? { 'metadata.action': action } : {};

  return AnalyticsEvent.aggregate([
    {
      $match: {
        ...eventDateMatch(range),
        eventType,
        entityType: 'job',
        'metadata.domain': { $exists: true, $ne: null },
        ...metadataActionMatch,
      },
    },
    {
      $group: {
        _id: '$metadata.domain',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, domain: '$_id', count: 1 } },
  ]);
}

export async function getInsightsJobs(range: InsightsDateRange = {}) {
  const limit = clampLimit(range.limit);
  const [matched, viewed, liked, disliked, matchedDomains, likedDomains] =
    await Promise.all([
      topJobEvents('job_matched', range, limit),
      topJobEvents('job_viewed', range, limit),
      topJobEvents('job_swiped', range, limit, 'like'),
      topJobEvents('job_swiped', range, limit, 'dislike'),
      topDomains('job_matched', range, limit),
      topDomains('job_swiped', range, limit, 'like'),
    ]);

  const viewedIds = new Set(viewed.map((item) => item.jobId));
  const likedIds = new Set(liked.map((item) => item.jobId));

  const recommendationInterestGap = matched
    .filter((item) => !viewedIds.has(item.jobId) && !likedIds.has(item.jobId))
    .slice(0, limit);

  return {
    matched,
    viewed,
    liked,
    disliked,
    domains: {
      matched: matchedDomains,
      liked: likedDomains,
    },
    recommendationInterestGap,
  };
}

async function topArrayValues(
  collection: typeof BilanCompetence | typeof WorkStyleResult,
  path: string,
  range: InsightsDateRange,
  limit: number
) {
  return collection.aggregate([
    { $match: createdAtMatch(range) },
    { $unwind: `$${path}` },
    {
      $group: {
        _id: `$${path}`,
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 0, key: '$_id', count: 1 } },
  ]);
}

export async function getInsightsOrientation(range: InsightsDateRange = {}) {
  const limit = clampLimit(range.limit);

  const [
    competenceStrengths,
    competenceToImprove,
    softSkillStrengths,
    values,
    workConditions,
    workStyleAxes,
    workStyleProfiles,
  ] = await Promise.all([
    topArrayValues(
      BilanCompetence,
      'investigation.competence.strengths',
      range,
      limit
    ),
    topArrayValues(
      BilanCompetence,
      'investigation.competence.toImprove',
      range,
      limit
    ),
    topArrayValues(
      BilanCompetence,
      'investigation.softSkills.strengths',
      range,
      limit
    ),
    topArrayValues(BilanCompetence, 'investigation.topValues', range, limit),
    topArrayValues(
      BilanCompetence,
      'investigation.topWorkConditions',
      range,
      limit
    ),
    topArrayValues(WorkStyleResult, 'topAxes', range, limit),
    WorkStyleResult.aggregate([
      { $match: createdAtMatch(range) },
      {
        $group: {
          _id: '$profile.key',
          title: { $first: '$profile.title' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, title: 1 } },
      { $limit: limit },
      { $project: { _id: 0, key: '$_id', title: 1, count: 1 } },
    ]),
  ]);

  return {
    competenceStrengths,
    competenceToImprove,
    softSkillStrengths,
    values,
    workConditions,
    workStyleAxes,
    workStyleProfiles,
  };
}
