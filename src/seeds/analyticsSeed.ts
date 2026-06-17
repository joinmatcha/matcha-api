import { Types } from 'mongoose';

import { AnalyticsEvent } from '@/models/AnalyticsEvent';
import { BilanCompetence } from '@/models/BilanCompetence';
import User from '@/models/User';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { hashAnalyticsUserId } from '@/services/analytics/tracking';

const seedBatch = 'matcha-insights-v1';

const tests = [
  {
    entityType: 'personality',
    entityId: 'personality-v1',
    label: 'Test de personnalité',
    total: 24,
  },
  {
    entityType: 'bilan',
    entityId: 'bilan-v2',
    label: 'Auto-évaluation professionnelle',
    total: 36,
  },
  {
    entityType: 'work_style',
    entityId: 'work-style-v1',
    label: 'Style professionnel',
    total: 16,
  },
] as const;

const jobs = [
  {
    id: 'K1801',
    title: 'Conseiller en insertion professionnelle',
    domain: 'Action sociale',
  },
  { id: 'M1805', title: 'Développeur web', domain: 'Informatique' },
  { id: 'M1402', title: 'Conseiller clientèle', domain: 'Relation client' },
  { id: 'F1602', title: 'Electricien du bâtiment', domain: 'Second oeuvre' },
  { id: 'E1104', title: 'Chargé de communication', domain: 'Communication' },
  { id: 'K1207', title: 'Educateur spécialisé', domain: 'Action sociale' },
  {
    id: 'M1502',
    title: 'Assistant ressources humaines',
    domain: 'Ressources humaines',
  },
  { id: 'G1203', title: 'Animateur touristique', domain: 'Tourisme' },
  { id: 'H1206', title: 'Designer produit', domain: 'Design' },
  { id: 'J1502', title: 'Assistant médical', domain: 'Santé' },
];

const competenceSets = [
  ['analysis', 'communication', 'planning'],
  ['listening', 'pedagogy', 'teamwork'],
  ['problem_solving', 'autonomy', 'digital'],
  ['organization', 'customer_relation', 'adaptability'],
];

const toImproveSets = [
  ['organization', 'assertiveness'],
  ['technical_depth', 'prioritization'],
  ['public_speaking', 'project_management'],
];

const styleProfiles = [
  {
    key: 'autonomous_structured',
    title: 'Autonome structuré',
    axes: ['autonomy', 'structure', 'learning'],
  },
  {
    key: 'collaborative_dynamic',
    title: 'Collaboratif dynamique',
    axes: ['collaboration', 'pace', 'human_contact'],
  },
  {
    key: 'field_relational',
    title: 'Terrain relationnel',
    axes: ['mobility', 'human_contact', 'variety'],
  },
];

const dateDaysAgo = (days: number, hourOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + hourOffset, 15, 0, 0);
  return date;
};

function pick<T>(items: readonly T[], index: number) {
  return items[index % items.length];
}

export async function seedAnalytics() {
  const existingUsers = await User.find({
    email: /^insights-seed-\d+@matcha\.local$/,
  }).select('_id');
  const existingUserIds = existingUsers.map((user) => user._id);

  await Promise.all([
    AnalyticsEvent.deleteMany({ 'metadata.seedBatch': seedBatch }),
    BilanCompetence.deleteMany({ user: { $in: existingUserIds } }),
    WorkStyleResult.deleteMany({ user: { $in: existingUserIds } }),
    User.deleteMany({ email: /^insights-seed-\d+@matcha\.local$/ }),
  ]);

  const users = await User.create(
    Array.from({ length: 18 }).map((_, index) => ({
      email: `insights-seed-${index + 1}@matcha.local`,
      passwordHash: 'seeded-password-hash',
      firstName: `Seed${index + 1}`,
      lastName: 'Insights',
      consentAccepted: true,
      isEmailVerified: true,
    }))
  );

  const events = [];

  for (let sessionIndex = 0; sessionIndex < 54; sessionIndex += 1) {
    const user = pick(users, sessionIndex);
    const test = pick(tests, sessionIndex);
    const day = sessionIndex % 12;
    const sessionId = `seed-session-${sessionIndex + 1}`;
    const completed = sessionIndex % 5 !== 0;
    const answeredCount = completed
      ? test.total
      : Math.max(3, Math.floor((test.total * ((sessionIndex % 6) + 2)) / 10));
    const startedAt = dateDaysAgo(day, sessionIndex % 6);
    const userHash = hashAnalyticsUserId(user._id.toString());

    events.push({
      eventType: 'test_started',
      userHash,
      sessionId,
      source: 'mobile',
      entityType: test.entityType,
      entityId: test.entityId,
      metadata: {
        seedBatch,
        testName: test.label,
        version: test.entityType === 'bilan' ? 2 : 1,
        totalQuestions: test.total,
      },
      occurredAt: startedAt,
      receivedAt: startedAt,
    });

    for (let step = 1; step <= Math.min(answeredCount, 8); step += 1) {
      const stepDate = new Date(startedAt.getTime() + step * 45_000);
      events.push({
        eventType: 'test_step_completed',
        userHash,
        sessionId,
        source: 'mobile',
        entityType: test.entityType,
        entityId: test.entityId,
        stepId: `${test.entityType}-${step}`,
        metadata: {
          seedBatch,
          stepIndex: step,
          totalSteps: test.total,
        },
        occurredAt: stepDate,
        receivedAt: stepDate,
      });
    }

    const endDate = new Date(startedAt.getTime() + answeredCount * 45_000);

    if (completed) {
      events.push({
        eventType: 'test_completed',
        userHash,
        sessionId,
        source: 'mobile',
        entityType: test.entityType,
        entityId: test.entityId,
        metadata: {
          seedBatch,
          durationMs: answeredCount * 45_000,
        },
        occurredAt: endDate,
        receivedAt: endDate,
      });
    } else {
      events.push({
        eventType: 'test_abandoned',
        userHash,
        sessionId,
        source: 'mobile',
        entityType: test.entityType,
        entityId: test.entityId,
        stepId: `${test.entityType}-${answeredCount}`,
        metadata: {
          seedBatch,
          answeredCount,
          totalQuestions: test.total,
          durationMs: answeredCount * 45_000,
        },
        occurredAt: endDate,
        receivedAt: endDate,
      });
    }

    if (test.entityType === 'bilan' && completed) {
      const recommended = [
        pick(jobs, sessionIndex),
        pick(jobs, sessionIndex + 3),
        pick(jobs, sessionIndex + 5),
      ];
      recommended.forEach((job, rank) => {
        events.push({
          eventType: 'job_matched',
          userHash,
          sessionId,
          source: 'mobile',
          entityType: 'job',
          entityId: job.id,
          metadata: {
            seedBatch,
            jobTitle: job.title,
            domain: job.domain,
            rank: rank + 1,
            score: 92 - rank * 7,
            sourceTest: 'bilan',
          },
          occurredAt: new Date(endDate.getTime() + rank * 15_000),
          receivedAt: new Date(endDate.getTime() + rank * 15_000),
        });
      });
    }

    const viewedJob = pick(jobs, sessionIndex + 2);
    const action = sessionIndex % 4 === 0 ? 'dislike' : 'like';
    events.push(
      {
        eventType: 'job_viewed',
        userHash,
        sessionId,
        source: 'mobile',
        entityType: 'job',
        entityId: viewedJob.id,
        metadata: {
          seedBatch,
          jobTitle: viewedJob.title,
          domain: viewedJob.domain,
          entryPoint: sessionIndex % 2 === 0 ? 'swipe' : 'result',
        },
        occurredAt: new Date(endDate.getTime() + 120_000),
        receivedAt: new Date(endDate.getTime() + 120_000),
      },
      {
        eventType: 'job_swiped',
        userHash,
        sessionId,
        source: 'mobile',
        entityType: 'job',
        entityId: viewedJob.id,
        metadata: {
          seedBatch,
          action,
          jobTitle: viewedJob.title,
          domain: viewedJob.domain,
        },
        occurredAt: new Date(endDate.getTime() + 150_000),
        receivedAt: new Date(endDate.getTime() + 150_000),
      }
    );
  }

  await AnalyticsEvent.insertMany(events);

  await BilanCompetence.insertMany(
    users.slice(0, 14).map((user, index) => {
      const strengths = pick(competenceSets, index);
      const toImprove = pick(toImproveSets, index);
      const recommendedJobs = [
        pick(jobs, index),
        pick(jobs, index + 4),
        pick(jobs, index + 7),
      ].map((job, rank) => ({
        id: job.id,
        title: job.title,
        sector: job.domain,
        score: 90 - rank * 6,
      }));

      return {
        user: user._id,
        version: 2,
        createdAt: dateDaysAgo(index % 12),
        rawAnswers: [],
        scores: {
          competence: {},
          soft_skill: {},
          value: {},
          work_condition: {},
          interest: {},
          feasibility: {},
        },
        investigation: {
          competence: {
            strengths,
            acquired: strengths.slice(0, 2),
            toImprove,
          },
          softSkills: {
            strengths: ['communication', 'adaptability', 'teamwork'].slice(
              0,
              (index % 3) + 1
            ),
            acquired: [],
            toImprove: ['confidence'],
          },
          topValues: ['impact', 'stability', 'learning'].slice(0, 2),
          topWorkConditions: ['autonomy', 'hybrid', 'clear_framework'].slice(
            0,
            (index % 3) + 1
          ),
          interestsProfile: ['RIASEC_S', 'RIASEC_I'],
          feasibilityProfile: ['short_training'],
        },
        conclusion: {
          archetype: {
            id: 'seed-profile',
            title: 'Profil seed',
            subtitle: 'Données de démonstration',
            description: 'Profil généré pour Matcha Insights.',
          },
          profileSummary: 'Profil généré pour démontrer les insights.',
          keyStrengths: strengths,
          improvementAxes: toImprove,
          recommendedEnvironments: ['Equipe bienveillante'],
          recommendedJobs,
          actionPlan: ['Explorer les métiers recommandés'],
        },
      };
    })
  );

  await WorkStyleResult.insertMany(
    users.slice(0, 12).map((user, index) => {
      const profile = pick(styleProfiles, index);
      return {
        user: user._id,
        versionId: new Types.ObjectId(),
        version: 1,
        answers: [],
        scores: {
          autonomy: 70,
          collaboration: 60,
          pace: 55,
          structure: 65,
          variety: 58,
          human_contact: 72,
          mobility: 50,
          learning: 68,
        },
        topAxes: profile.axes,
        profile: {
          key: profile.key,
          title: profile.title,
          description: 'Profil de démonstration pour Matcha Insights.',
          strengths: ['Cadre adapté', 'Motivation durable'],
          cautions: ['À confirmer avec les fiches métier'],
          advice: ['Comparer plusieurs environnements'],
        },
        createdAt: dateDaysAgo(index % 12),
        updatedAt: dateDaysAgo(index % 12),
      };
    })
  );

  return {
    users: users.length,
    events: events.length,
    bilans: 14,
    workStyleResults: 12,
  };
}
