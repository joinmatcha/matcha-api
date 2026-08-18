import bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { AnalyticsEvent } from '@/models/AnalyticsEvent';
import { BilanCompetence } from '@/models/BilanCompetence';
import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import { MatchingDecision } from '@/models/MatchingDecision';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import PersonalityTest from '@/models/PersonalityTest';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import { RecommendationProfile } from '@/models/RecommendationProfile';
import { RomeMetier } from '@/models/RomeMetier';
import { SupportRequest } from '@/models/SupportRequest';
import { Swipe } from '@/models/Swipe';
import { SwipeQuota } from '@/models/SwipeQuota';
import User from '@/models/User';
import { WorkStyleQuestion } from '@/models/WorkStyleQuestion';
import { WorkStyleResult } from '@/models/WorkStyleResult';
import { WorkStyleVersion } from '@/models/WorkStyleVersion';
import { hashAnalyticsUserId } from '@/services/analytics/tracking';

const seedBatch = 'matcha-demo-usage-v1';
const demoEmailDomains = [
  'gmail.com',
  'outlook.fr',
  'hotmail.com',
  'hotmail.fr',
  'yahoo.com',
];
const appVersion = '1.0.0-demo';

const seedStart = new Date('2026-07-04T08:00:00.000Z');
const seedEnd = new Date('2026-08-17T18:00:00.000Z');
const accountCreationHoursParis = [
  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0,
];

type Persona = {
  firstName: string;
  lastName: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other' | 'undisclosed';
  city: string;
  postalCode: string;
  country: string;
  locationPref: 'remote' | 'hybrid' | 'on-site';
  remote: boolean;
  jobTypes: string[];
  archetype: string;
  personalityType: string;
  personalityLabel: string;
  sectors: string[];
  strengths: string[];
  improvements: string[];
  workStyleKey: string;
  workStyleTitle: string;
};

type DemoEventDraft = {
  eventType:
    | 'test_started'
    | 'test_step_completed'
    | 'test_completed'
    | 'test_abandoned'
    | 'job_swiped';
  entityType: 'bilan' | 'personality' | 'work_style' | 'job';
  entityId: string;
  stepId?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
};

const basePersonas: Persona[] = [
  {
    firstName: 'Clara',
    lastName: 'Martin',
    birthYear: 1999,
    gender: 'female',
    city: 'Paris',
    postalCode: '75015',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['accompagnement', 'formation', 'relation client'],
    archetype: "L'actrice de terrain",
    personalityType: 'INFJ',
    personalityLabel: 'Conseiller',
    sectors: ['Action sociale', 'Formation', 'Ressources humaines'],
    strengths: ['communication', 'ecoute', 'organisation'],
    improvements: ['assertivite', 'prise_de_parole'],
    workStyleKey: 'collaborative_structured',
    workStyleTitle: 'Collaboratif structuré',
  },
  {
    firstName: 'Mehdi',
    lastName: 'Benali',
    birthYear: 1997,
    gender: 'male',
    city: 'Boulogne-Billancourt',
    postalCode: '92100',
    country: 'France',
    locationPref: 'on-site',
    remote: false,
    jobTypes: ['terrain', 'logistique', 'maintenance'],
    archetype: 'Le profil opérationnel',
    personalityType: 'ISTP',
    personalityLabel: 'Pragmatique',
    sectors: ['Maintenance', 'Logistique', 'Industrie'],
    strengths: ['resolution_probleme', 'autonomie', 'rigueur'],
    improvements: ['communication_ecrite', 'planification'],
    workStyleKey: 'field_autonomous',
    workStyleTitle: 'Terrain autonome',
  },
  {
    firstName: 'Ines',
    lastName: 'Rousseau',
    birthYear: 2001,
    gender: 'female',
    city: 'Saint-Denis',
    postalCode: '93200',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['communication', 'design', 'marketing'],
    archetype: 'La créative structurée',
    personalityType: 'ENFP',
    personalityLabel: 'Explorateur',
    sectors: ['Communication', 'Design', 'Culture'],
    strengths: ['creativite', 'adaptabilite', 'curiosite'],
    improvements: ['priorisation', 'cadre_methodologique'],
    workStyleKey: 'creative_collaborative',
    workStyleTitle: 'Créatif collaboratif',
  },
  {
    firstName: 'Thomas',
    lastName: 'Lefevre',
    birthYear: 1995,
    gender: 'male',
    city: 'Montreuil',
    postalCode: '93100',
    country: 'France',
    locationPref: 'remote',
    remote: true,
    jobTypes: ['data', 'informatique', 'analyse'],
    archetype: "L'analyste autonome",
    personalityType: 'INTJ',
    personalityLabel: 'Stratège',
    sectors: ['Informatique', 'Etudes et conseil', 'Data'],
    strengths: ['analyse', 'logique', 'apprentissage'],
    improvements: ['collaboration', 'vulgarisation'],
    workStyleKey: 'autonomous_analytical',
    workStyleTitle: 'Autonome analytique',
  },
  {
    firstName: 'Sarah',
    lastName: 'Petit',
    birthYear: 1998,
    gender: 'female',
    city: 'Créteil',
    postalCode: '94000',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['sante', 'administratif', 'accueil'],
    archetype: 'La coordinatrice attentive',
    personalityType: 'ISFJ',
    personalityLabel: 'Protecteur',
    sectors: ['Santé', 'Administratif', 'Services'],
    strengths: ['fiabilite', 'empathie', 'suivi'],
    improvements: ['initiative', 'confiance'],
    workStyleKey: 'supportive_structured',
    workStyleTitle: 'Support structuré',
  },
  {
    firstName: 'Lucas',
    lastName: 'Moreau',
    birthYear: 2000,
    gender: 'male',
    city: 'Nanterre',
    postalCode: '92000',
    country: 'France',
    locationPref: 'on-site',
    remote: false,
    jobTypes: ['commerce', 'animation', 'vente'],
    archetype: 'Le relationnel dynamique',
    personalityType: 'ESFP',
    personalityLabel: 'Animateur',
    sectors: ['Commerce', 'Tourisme', 'Animation'],
    strengths: ['relation_client', 'energie', 'adaptabilite'],
    improvements: ['organisation', 'constance'],
    workStyleKey: 'dynamic_relational',
    workStyleTitle: 'Relationnel dynamique',
  },
  {
    firstName: 'Camille',
    lastName: 'Garnier',
    birthYear: 1996,
    gender: 'female',
    city: 'Versailles',
    postalCode: '78000',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['rh', 'gestion', 'administration'],
    archetype: 'La facilitatrice organisée',
    personalityType: 'ESFJ',
    personalityLabel: 'Facilitateur',
    sectors: ['Ressources humaines', 'Administratif', 'Formation'],
    strengths: ['coordination', 'communication', 'service'],
    improvements: ['analyse_chiffree', 'prise_de_recul'],
    workStyleKey: 'people_coordinator',
    workStyleTitle: 'Coordinateur humain',
  },
  {
    firstName: 'Antoine',
    lastName: 'Dubois',
    birthYear: 1994,
    gender: 'male',
    city: 'Argenteuil',
    postalCode: '95100',
    country: 'France',
    locationPref: 'remote',
    remote: true,
    jobTypes: ['technique', 'industrie', 'qualite'],
    archetype: 'Le technicien méthodique',
    personalityType: 'ISTJ',
    personalityLabel: 'Organisateur',
    sectors: ['Industrie', 'Qualité', 'Maintenance'],
    strengths: ['rigueur', 'controle', 'methode'],
    improvements: ['souplesse', 'communication'],
    workStyleKey: 'methodical_specialist',
    workStyleTitle: 'Spécialiste méthodique',
  },
  {
    firstName: 'Lea',
    lastName: 'Fontaine',
    birthYear: 2002,
    gender: 'female',
    city: 'Massy',
    postalCode: '91300',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['environnement', 'terrain', 'mediation'],
    archetype: "L'exploratrice engagée",
    personalityType: 'INFP',
    personalityLabel: 'Médiateur',
    sectors: ['Environnement', 'Action sociale', 'Education'],
    strengths: ['sens', 'creativite', 'ecoute'],
    improvements: ['structure', 'concretisation'],
    workStyleKey: 'purpose_driven',
    workStyleTitle: 'Engagé par le sens',
  },
  {
    firstName: 'Yanis',
    lastName: 'Nguyen',
    birthYear: 1998,
    gender: 'male',
    city: 'Paris',
    postalCode: '75011',
    country: 'France',
    locationPref: 'hybrid',
    remote: true,
    jobTypes: ['produit', 'digital', 'support'],
    archetype: 'Le bâtisseur digital',
    personalityType: 'ENTP',
    personalityLabel: 'Innovateur',
    sectors: ['Informatique', 'Produit', 'Relation client'],
    strengths: ['ideation', 'resolution_probleme', 'apprentissage'],
    improvements: ['finalisation', 'documentation'],
    workStyleKey: 'digital_builder',
    workStyleTitle: 'Bâtisseur digital',
  },
  {
    firstName: 'Julie',
    lastName: 'Bernard',
    birthYear: 1993,
    gender: 'female',
    city: 'Lyon',
    postalCode: '69003',
    country: 'France',
    locationPref: 'on-site',
    remote: false,
    jobTypes: ['tourisme', 'accueil', 'vente'],
    archetype: "L'ambassadrice terrain",
    personalityType: 'ENFJ',
    personalityLabel: 'Coach',
    sectors: ['Tourisme', 'Commerce', 'Services'],
    strengths: ['accueil', 'leadership', 'adaptabilite'],
    improvements: ['analyse', 'gestion_stress'],
    workStyleKey: 'frontline_leader',
    workStyleTitle: 'Leader de terrain',
  },
  {
    firstName: 'Hugo',
    lastName: 'Robert',
    birthYear: 1999,
    gender: 'male',
    city: 'Nantes',
    postalCode: '44000',
    country: 'France',
    locationPref: 'remote',
    remote: true,
    jobTypes: ['support', 'qualite', 'informatique'],
    archetype: 'Le résolveur patient',
    personalityType: 'INTP',
    personalityLabel: 'Analyste',
    sectors: ['Informatique', 'Support', 'Qualité'],
    strengths: ['diagnostic', 'patience', 'logique'],
    improvements: ['rythme', 'contact_client'],
    workStyleKey: 'patient_solver',
    workStyleTitle: 'Résolveur patient',
  },
];

const parisRegionLocations = [
  ['Paris', '75012'],
  ['Paris', '75018'],
  ['Levallois-Perret', '92300'],
  ['Courbevoie', '92400'],
  ['Asnières-sur-Seine', '92600'],
  ['Clichy', '92110'],
  ['Ivry-sur-Seine', '94200'],
  ['Vincennes', '94300'],
  ['Noisy-le-Grand', '93160'],
  ['Aubervilliers', '93300'],
  ['Colombes', '92700'],
  ['Rueil-Malmaison', '92500'],
  ['Issy-les-Moulineaux', '92130'],
  ['Saint-Maur-des-Fossés', '94100'],
  ['Maisons-Alfort', '94700'],
  ['Cergy', '95000'],
  ['Antony', '92160'],
  ['Clamart', '92140'],
  ['Puteaux', '92800'],
  ['Meaux', '77100'],
  ['Évry-Courcouronnes', '91000'],
  ['Sarcelles', '95200'],
  ['Bagneux', '92220'],
  ['Suresnes', '92150'],
  ['Melun', '77000'],
  ['Saint-Germain-en-Laye', '78100'],
  ['Fontenay-sous-Bois', '94120'],
] as const;

const provinceLocations = [
  ['Lille', '59000'],
  ['Bordeaux', '33000'],
  ['Toulouse', '31000'],
  ['Marseille', '13006'],
] as const;

const extraNames = [
  ['Emma', 'Lemoine', 'female'],
  ['Nicolas', 'Marchand', 'male'],
  ['Manon', 'Carpentier', 'female'],
  ['Romain', 'Chevalier', 'male'],
  ['Laura', 'Perrot', 'female'],
  ['Mathis', 'Mercier', 'male'],
  ['Chloe', 'Renard', 'female'],
  ['Julien', 'Blanchard', 'male'],
  ['Sophie', 'Muller', 'female'],
  ['Baptiste', 'Girard', 'male'],
  ['Marie', 'Lopez', 'female'],
  ['Adrien', 'Faure', 'male'],
  ['Elise', 'Andre', 'female'],
  ['Guillaume', 'Lambert', 'male'],
  ['Nina', 'Henry', 'female'],
  ['Maxime', 'Barbier', 'male'],
  ['Amina', 'Philippe', 'female'],
  ['Quentin', 'Renaud', 'male'],
  ['Louise', 'Perrin', 'female'],
  ['Samir', 'Morin', 'male'],
  ['Eva', 'Leclerc', 'female'],
  ['Pierre', 'Guerin', 'male'],
  ['Pauline', 'Boyer', 'female'],
  ['Vincent', 'Rolland', 'male'],
  ['Marine', 'Caron', 'female'],
  ['Alexandre', 'Gauthier', 'male'],
  ['Charlotte', 'Dupuy', 'female'],
  ['Theo', 'Meyer', 'male'],
  ['Celine', 'Colin', 'female'],
  ['Florent', 'Vidal', 'male'],
  ['Audrey', 'Masson', 'female'],
] as const;

function buildPersonas() {
  const generated = extraNames.map(([firstName, lastName, gender], index) => {
    const base = basePersonas[index % basePersonas.length];
    const [city, postalCode] =
      index < parisRegionLocations.length
        ? parisRegionLocations[index]
        : provinceLocations[index - parisRegionLocations.length];

    return {
      ...base,
      firstName,
      lastName,
      gender: gender as Persona['gender'],
      birthYear: 1993 + ((index * 3) % 11),
      city,
      postalCode,
    };
  });

  return [...basePersonas, ...generated];
}

const personas = buildPersonas();
const completedBilanCount = 37;
const completedPersonalityCount = 35;
const completedWorkStyleCount = 31;
const completedRecommendationCount = 29;

const supportMessages = [
  {
    category: 'bug' as const,
    subject: 'Affichage mobile sur une fiche métier',
    message:
      "Sur mon téléphone Android, le bouton d'une carte était un peu bas sur l'écran.",
    status: 'resolved' as const,
  },
  {
    category: 'account' as const,
    subject: 'Validation email',
    message:
      "Je n'avais pas compris tout de suite qu'il fallait valider mon email avant de me connecter.",
    status: 'closed' as const,
  },
  {
    category: 'other' as const,
    subject: 'Compréhension du score',
    message:
      'Le score métier est utile, mais une phrase de contexte aiderait à comprendre le classement.',
    status: 'in_progress' as const,
  },
];

const clampDate = (date: Date) =>
  new Date(
    Math.min(Math.max(date.getTime(), seedStart.getTime()), seedEnd.getTime())
  );

const addMinutes = (date: Date, minutes: number) =>
  clampDate(new Date(date.getTime() + minutes * 60_000));

const dayKeyUTC = (date: Date) => date.toISOString().slice(0, 10);

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');

const stableIndex = (seed: string, modulo: number) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
};

const demoEmailDomainForPersona = (persona: Persona, index: number) => {
  const weightedDomains = [
    'gmail.com',
    'outlook.fr',
    'hotmail.com',
    'hotmail.fr',
    'yahoo.com',
  ] as const;

  return weightedDomains[
    stableIndex(
      `${persona.firstName}-${persona.lastName}-${index}`,
      weightedDomains.length
    )
  ];
};

const demoEmailLocalPartForPersona = (persona: Persona, index: number) => {
  const firstName = slugify(persona.firstName);
  const lastName = slugify(persona.lastName);
  const formats = [
    `${firstName}.${lastName}`,
    `${firstName}${lastName}`,
    `${firstName[0]}.${lastName}`,
    `${firstName}.${lastName}${String(persona.birthYear).slice(-2)}`,
    `${lastName}.${firstName}`,
    `${firstName}${String(77 + index * 3)}`,
  ];

  return formats[index % formats.length];
};

const demoEmailForPersona = (persona: Persona, index: number) =>
  `${demoEmailLocalPartForPersona(persona, index)}@${demoEmailDomainForPersona(
    persona,
    index
  )}`;

const legacyDemoEmailForPersona = (persona: Persona, index: number) =>
  `${slugify(persona.firstName)}.${slugify(persona.lastName)}.${String(
    202607 + index * 17
  )}@${demoEmailDomainForPersona(persona, index)}`;

function dateForIndex(index: number, hour?: number) {
  const spanMs = seedEnd.getTime() - seedStart.getTime();
  const ratio = index / Math.max(personas.length - 1, 1);
  const jitterMs = ((index * 37) % 9) * 60 * 60 * 1000;
  const date = new Date(seedStart.getTime() + spanMs * ratio + jitterMs);
  const parisHour = hour ?? pick(accountCreationHoursParis, index);
  // Seed period is July/August 2026, so Paris local time is UTC+2.
  const utcHour = parisHour === 0 ? 22 : parisHour - 2;
  date.setUTCHours(utcHour, 10 + ((index * 7) % 45), 0, 0);
  return clampDate(date);
}

function pick<T>(items: readonly T[], index: number) {
  return items[index % items.length];
}

function scoreMap(keys: string[], base: number) {
  return keys.reduce<Record<string, number>>((acc, key, index) => {
    acc[key] = Math.max(42, Math.min(95, base - index * 7));
    return acc;
  }, {});
}

async function findSeedUserIds() {
  const seedEmailMatch = {
    $or: [
      {
        email: {
          $in: [
            ...personas.map(demoEmailForPersona),
            ...personas.map(legacyDemoEmailForPersona),
          ],
        },
      },
      {
        email: { $regex: '@example\\.(com|net|org)$', $options: 'i' },
        createdAt: { $gte: seedStart, $lte: seedEnd },
      },
    ],
  };

  const [users, recommendationUserIds, supportUserIds] = await Promise.all([
    User.find(seedEmailMatch).select('_id'),
    RecommendationProfile.distinct('user', {
      algorithmVersion: 'profile-matching-v4-demo',
    }),
    SupportRequest.distinct('user', {
      email: { $regex: '@example\\.(com|net|org)$', $options: 'i' },
      createdAt: { $gte: seedStart, $lte: seedEnd },
    }),
  ]);

  const userIds = new Set<string>();
  for (const user of users) userIds.add(user._id.toString());
  for (const userId of recommendationUserIds) {
    if (userId) userIds.add(userId.toString());
  }
  for (const userId of supportUserIds) {
    if (userId) userIds.add(userId.toString());
  }

  return [...userIds]
    .filter((userId) => Types.ObjectId.isValid(userId))
    .map((userId) => new Types.ObjectId(userId));
}

export async function cleanupSeedUsers() {
  const userIds = await findSeedUserIds();

  const [
    analyticsEvents,
    bilans,
    matchingDecisions,
    personalityTests,
    recommendationProfiles,
    supportRequests,
    swipes,
    swipeQuotas,
    workStyleResults,
    users,
  ] = await Promise.all([
    AnalyticsEvent.deleteMany({
      $or: [
        { 'metadata.seedBatch': seedBatch },
        { sessionId: /^demo-usage-/ },
        { appVersion },
      ],
    }),
    BilanCompetence.deleteMany({ user: { $in: userIds } }),
    MatchingDecision.deleteMany({ userId: { $in: userIds } }),
    PersonalityTest.deleteMany({ userId: { $in: userIds } }),
    RecommendationProfile.deleteMany({
      $or: [
        { user: { $in: userIds } },
        { algorithmVersion: 'profile-matching-v4-demo' },
      ],
    }),
    SupportRequest.deleteMany({
      $or: [
        { user: { $in: userIds } },
        {
          email: { $regex: '@example\\.(com|net|org)$', $options: 'i' },
          createdAt: { $gte: seedStart, $lte: seedEnd },
        },
      ],
    }),
    Swipe.deleteMany({ userId: { $in: userIds } }),
    SwipeQuota.deleteMany({ userId: { $in: userIds } }),
    WorkStyleResult.deleteMany({ user: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);

  return {
    users: users.deletedCount,
    bilans: bilans.deletedCount,
    personalityTests: personalityTests.deletedCount,
    workStyleResults: workStyleResults.deletedCount,
    recommendationProfiles: recommendationProfiles.deletedCount,
    swipes: swipes.deletedCount,
    swipeQuotas: swipeQuotas.deletedCount,
    matchingDecisions: matchingDecisions.deletedCount,
    supportRequests: supportRequests.deletedCount,
    analyticsEvents: analyticsEvents.deletedCount,
  };
}

async function cleanupDemoBatch() {
  await cleanupSeedUsers();
}

async function loadJobs() {
  const jobs = await RomeMetier.find({ isActive: true })
    .select('_id code label domain riasec sectors skills workContexts')
    .sort({ code: 1 })
    .limit(120)
    .lean();

  if (jobs.length < 30) {
    throw new Error(
      'Not enough active RomeMetier documents. Run yarn sync:jobs before seeding demo usage.'
    );
  }

  return jobs;
}

async function loadTestCatalogs() {
  const [bilanVersion, personalityVersion, workStyleVersion] =
    await Promise.all([
      BilanVersion.findOne({ isActive: true }).sort({ version: -1 }).lean(),
      PersonalityVersion.findOne({ isActive: true })
        .sort({ createdAt: -1 })
        .lean(),
      WorkStyleVersion.findOne({ isActive: true }).sort({ version: -1 }).lean(),
    ]);

  if (!bilanVersion) {
    throw new Error('No active BilanVersion found. Run yarn seed:bilan first.');
  }
  if (!personalityVersion) {
    throw new Error(
      'No active PersonalityVersion found. Run yarn seed:personality first.'
    );
  }
  if (!workStyleVersion) {
    throw new Error(
      'No active WorkStyleVersion found. Run yarn seed:work-style first.'
    );
  }

  const [bilanQuestions, personalityQuestions, workStyleQuestions] =
    await Promise.all([
      BilanQuestion.find({
        version: bilanVersion.version,
        isActive: true,
      })
        .sort({ code: 1 })
        .lean(),
      PersonalityQuestion.find({
        versionId: personalityVersion._id,
        isActive: true,
      })
        .sort({ order: 1 })
        .lean(),
      WorkStyleQuestion.find({
        versionId: workStyleVersion._id,
        isActive: true,
      })
        .sort({ order: 1 })
        .lean(),
    ]);

  if (bilanQuestions.length === 0) {
    throw new Error(
      'No active BilanQuestion found. Run yarn seed:bilan first.'
    );
  }
  if (personalityQuestions.length === 0) {
    throw new Error(
      'No active PersonalityQuestion found. Run yarn seed:personality first.'
    );
  }
  if (workStyleQuestions.length === 0) {
    throw new Error(
      'No active WorkStyleQuestion found. Run yarn seed:work-style first.'
    );
  }

  return {
    bilanVersion,
    bilanQuestions,
    personalityVersion,
    personalityQuestions,
    workStyleVersion,
    workStyleQuestions,
  };
}

export async function seedDemoUsage() {
  await cleanupDemoBatch();

  const jobs = await loadJobs();
  const catalogs = await loadTestCatalogs();
  const passwordHash = await bcrypt.hash('MatchaDemo123!', 10);

  const users = await User.insertMany(
    personas.map((persona, index) => {
      const registeredAt = dateForIndex(index);
      return {
        email: demoEmailForPersona(persona, index),
        passwordHash,
        firstName: persona.firstName,
        lastName: persona.lastName,
        birthYear: persona.birthYear,
        gender: persona.gender,
        subscription: 'free',
        role: 'user',
        jobTypes: persona.jobTypes,
        locationPref: persona.locationPref,
        remote: persona.remote,
        consentAccepted: true,
        consentTimestamp: registeredAt,
        isEmailVerified: index % 9 !== 0,
        addressStreet: `${12 + index} rue des Ateliers`,
        addressCity: persona.city,
        addressPostalCode: persona.postalCode,
        addressCountry: persona.country,
        location: {
          type: 'Point',
          coordinates: [2.35 + index / 100, 48.85 - index / 120],
        },
        createdAt: registeredAt,
        updatedAt: addMinutes(registeredAt, 8),
      };
    })
  );

  const bilans = await BilanCompetence.insertMany(
    users.slice(0, completedBilanCount).map((user, index) => {
      const persona = personas[index];
      const completedAt = addMinutes(dateForIndex(index), 18);
      return {
        user: user._id,
        version: catalogs.bilanVersion.version,
        rawAnswers: catalogs.bilanQuestions.map((question, answerIndex) => ({
          questionCode: question.code,
          valueNumber: 3 + ((answerIndex + index) % 3),
        })),
        scores: {
          competence: scoreMap(persona.strengths, 88),
          soft_skill: scoreMap(
            ['communication', 'adaptability', 'teamwork'],
            82
          ),
          value: scoreMap(['impact', 'stability', 'learning'], 78),
          work_condition: scoreMap(
            [persona.locationPref, persona.remote ? 'remote' : 'presence'],
            75
          ),
          interest: scoreMap(persona.sectors, 84),
          feasibility: scoreMap(['short_training', 'accessible_market'], 72),
        },
        investigation: {
          competence: {
            strengths: persona.strengths,
            acquired: persona.strengths.slice(0, 2),
            toImprove: persona.improvements,
          },
          softSkills: {
            strengths: ['communication', 'adaptabilite', 'autonomie'].slice(
              0,
              2 + (index % 2)
            ),
            acquired: ['organisation'],
            toImprove: persona.improvements.slice(0, 1),
          },
          topValues: ['impact', 'apprentissage', 'stabilite'],
          topWorkConditions: [
            persona.locationPref,
            persona.remote ? 'remote' : 'presence',
            'cadre_clair',
          ],
          interestsProfile: ['RIASEC_S', 'RIASEC_I', 'RIASEC_A'].slice(
            0,
            2 + (index % 2)
          ),
          feasibilityProfile: ['short_training', 'accessible_market'],
        },
        conclusion: {
          archetype: {
            id: `demo-archetype-${index + 1}`,
            title: persona.archetype,
            subtitle: 'Profil consolidé Matcha',
            description:
              'Profil construit à partir des réponses aux tests et des préférences renseignées.',
          },
          profileSummary:
            'Profil cohérent avec des environnements où les compétences dominantes peuvent être mobilisées rapidement.',
          keyStrengths: persona.strengths,
          improvementAxes: persona.improvements,
          recommendedSectors: persona.sectors,
          actionPlan: [
            'Comparer les métiers recommandés',
            'Lire deux fiches métier détaillées',
            'Identifier une piste prioritaire à approfondir',
          ],
        },
        createdAt: completedAt,
      };
    })
  );

  const personalityTests = await PersonalityTest.insertMany(
    users.slice(0, completedPersonalityCount).map((user, index) => {
      const persona = personas[index];
      const completedAt = addMinutes(dateForIndex(index), 35);
      return {
        userId: user._id,
        templateId: catalogs.personalityVersion._id,
        templateVersion: catalogs.personalityVersion.version,
        answers: catalogs.personalityQuestions.map((question, answerIndex) => ({
          questionId: question._id.toString(),
          value: ((answerIndex + index) % 5) - 2,
        })),
        type: persona.personalityType,
        result: persona.personalityLabel,
        description:
          'Profil construit à partir des réponses au test de personnalité.',
        traits: persona.strengths,
        weaknesses: persona.improvements,
        suggestedSectors: persona.sectors,
        dimensionInsights: [
          {
            key: 'EI',
            label: 'Energie',
            preference: index % 2 === 0 ? 'introversion' : 'extraversion',
            score: 58 + (index % 4) * 8,
            intensity: 'marqué',
            description: 'Préférence dominante observée dans les réponses.',
          },
          {
            key: 'SN',
            label: 'Information',
            preference: index % 3 === 0 ? 'intuition' : 'observation',
            score: 54 + (index % 5) * 6,
            intensity: 'léger',
            description: 'Façon privilégiée de traiter les informations.',
          },
        ],
        workPreferences: [
          persona.locationPref,
          persona.remote ? 'flexibilite' : 'terrain',
        ],
        scoreBreakdown: {
          EI: index % 2 === 0 ? -3 : 3,
          SN: index % 3 === 0 ? 2 : -1,
          TF: index % 4 === 0 ? -2 : 2,
          JP: index % 2 === 0 ? 3 : -2,
        },
        createdAt: completedAt,
        updatedAt: completedAt,
      };
    })
  );

  const workStyleResults = await WorkStyleResult.insertMany(
    users.slice(0, completedWorkStyleCount).map((user, index) => {
      const persona = personas[index];
      const completedAt = addMinutes(dateForIndex(index), 48);
      return {
        user: user._id,
        versionId: catalogs.workStyleVersion._id,
        version: catalogs.workStyleVersion.version,
        answers: catalogs.workStyleQuestions.map((question, answerIndex) => ({
          questionId: question._id.toString(),
          value: 2 + ((answerIndex + index) % 4),
        })),
        scores: {
          autonomy: 62 + (index % 4) * 7,
          collaboration: 58 + ((index + 2) % 4) * 8,
          pace: 50 + ((index + 1) % 5) * 7,
          structure: 60 + (index % 3) * 9,
          variety: 56 + ((index + 3) % 4) * 8,
          human_contact: 64 + ((index + 1) % 4) * 7,
          mobility: persona.locationPref === 'on-site' ? 78 : 48,
          learning: 66 + (index % 4) * 6,
        },
        topAxes: persona.remote
          ? ['autonomy', 'learning', 'structure']
          : ['human_contact', 'mobility', 'pace'],
        profile: {
          key: persona.workStyleKey,
          title: persona.workStyleTitle,
          description:
            'Profil de style professionnel construit à partir des réponses au test.',
          strengths: persona.strengths.slice(0, 3),
          cautions: persona.improvements.slice(0, 2),
          advice: [
            'Comparer plusieurs environnements de travail',
            'Valider les contraintes concrètes du métier',
          ],
        },
        createdAt: completedAt,
        updatedAt: completedAt,
      };
    })
  );

  const profiles = await RecommendationProfile.insertMany(
    users.slice(0, completedRecommendationCount).map((user, index) => {
      const persona = personas[index];
      const selectedJobs = Array.from({ length: 8 + (index % 5) }).map(
        (_, jobIndex) => pick(jobs, index * 7 + jobIndex * 3)
      );
      const recalculatedAt = addMinutes(dateForIndex(index), 56);

      return {
        user: user._id,
        algorithmVersion: 'profile-matching-v4-demo',
        completedSources: ['bilan', 'personality', 'work_style', 'swipes'],
        missingSources: [],
        unlocked: true,
        sectors: persona.sectors.map((sector, sectorIndex) => ({
          key: slugify(sector),
          label: sector,
          weight: Number((3.2 - sectorIndex * 0.35).toFixed(2)),
          sources: ['bilan', 'personality'],
        })),
        interests: [
          { key: 'RIASEC_S', label: 'Social', weight: 2.8, sources: ['bilan'] },
          {
            key: 'RIASEC_I',
            label: 'Investigateur',
            weight: 2.1,
            sources: ['bilan'],
          },
        ],
        skills: persona.strengths.map((skill, skillIndex) => ({
          key: skill,
          label: skill.replace(/_/g, ' '),
          weight: Number((2.7 - skillIndex * 0.25).toFixed(2)),
          sources: ['bilan', 'work_style'],
        })),
        workConditions: [
          {
            key: persona.locationPref,
            label: persona.locationPref,
            weight: 1.9,
            sources: ['work_style'],
          },
        ],
        matchedJobs: selectedJobs.map((job, rank) => ({
          jobId: job._id,
          code: job.code,
          title: job.label,
          sector:
            job.domain?.label ?? persona.sectors[rank % persona.sectors.length],
          score: Math.max(42, 91 - rank * 4 - (index % 3) * 2),
          reasons: [
            'Compatible avec les intérêts dominants',
            rank % 2 === 0
              ? 'Mobilise des forces ou compétences proches des tiennes'
              : 'Dans un secteur qui ressort de ton profil',
          ],
        })),
        recalculatedAt,
        createdAt: recalculatedAt,
        updatedAt: recalculatedAt,
      };
    })
  );

  await Promise.all(
    users.slice(0, completedBilanCount).map((user, index) =>
      User.updateOne(
        { _id: user._id },
        {
          $set: {
            personalityTestId: personalityTests[index]?._id,
            workStyleResultId: workStyleResults[index]?._id,
          },
        }
      )
    )
  );

  const swipes = users.flatMap((user, userIndex) => {
    const firstSwipeAt = addMinutes(dateForIndex(userIndex), 70);
    const swipeCount = 5 + (userIndex % 7);
    return Array.from({ length: swipeCount }).map((_, swipeIndex) => {
      const swipedAt = addMinutes(firstSwipeAt, swipeIndex * 9);
      return {
        userId: user._id,
        jobId: pick(jobs, userIndex * 11 + swipeIndex * 5)._id,
        action: (swipeIndex + userIndex) % 4 === 0 ? 'dislike' : 'like',
        dayKey: dayKeyUTC(swipedAt),
        swipedAt,
      };
    });
  });

  await Swipe.insertMany(swipes);

  const quotaByUserDay = new Map<
    string,
    { userId: Types.ObjectId; dayKey: string; count: number }
  >();
  for (const swipe of swipes) {
    const key = `${swipe.userId.toString()}-${swipe.dayKey}`;
    const current = quotaByUserDay.get(key);
    quotaByUserDay.set(key, {
      userId: swipe.userId,
      dayKey: swipe.dayKey,
      count: (current?.count ?? 0) + 1,
    });
  }
  await SwipeQuota.insertMany([...quotaByUserDay.values()]);

  const matchingDecisions = profiles.flatMap((profile, profileIndex) => {
    const decidedAt = addMinutes(dateForIndex(profileIndex), 95);
    return profile.matchedJobs.slice(0, 5).map((job, decisionIndex) => ({
      userId: profile.user as Types.ObjectId,
      jobId: job.jobId,
      action: decisionIndex % 4 === 3 ? 'dislike' : 'like',
      decidedAt: addMinutes(decidedAt, decisionIndex * 6),
      createdAt: addMinutes(decidedAt, decisionIndex * 6),
      updatedAt: addMinutes(decidedAt, decisionIndex * 6),
    }));
  });
  await MatchingDecision.insertMany(matchingDecisions);

  await SupportRequest.insertMany(
    users.slice(2, 5).map((user, index) => {
      const persona = personas[index + 2];
      const support = pick(supportMessages, index);
      const createdAt = addMinutes(dateForIndex(index + 2), 130);
      return {
        user: user._id,
        email: user.email,
        name: `${persona.firstName} ${persona.lastName}`,
        ...support,
        adminNotes:
          support.status === 'resolved'
            ? 'Demande traitée après vérification du parcours mobile.'
            : undefined,
        handledAt: addMinutes(createdAt, 240),
        createdAt,
        updatedAt: addMinutes(createdAt, 240),
      };
    })
  );

  const events = users.flatMap((user, index) => {
    const userHash = hashAnalyticsUserId(user._id.toString());
    const registeredAt = dateForIndex(index);
    const sessionId = `demo-usage-${index + 1}`;
    const baseMetadata: Record<string, unknown> = {
      seedBatch,
      synthetic: true,
      demoOnly: true,
      personaIndex: index + 1,
    };

    const userEvents: DemoEventDraft[] = [
      {
        eventType: 'test_started',
        entityType: 'bilan',
        entityId: 'bilan-v2',
        stepId: undefined,
        metadata: { ...baseMetadata, totalQuestions: 56 },
        occurredAt: addMinutes(registeredAt, 12),
      },
    ];

    [1, 2, 3, 4].forEach((stepIndex) => {
      userEvents.push({
        eventType: 'test_step_completed',
        entityType: 'bilan',
        entityId: 'bilan-v2',
        stepId: catalogs.bilanQuestions[stepIndex - 1]?.code,
        metadata: {
          ...baseMetadata,
          stepIndex,
          totalSteps: catalogs.bilanQuestions.length,
        },
        occurredAt: addMinutes(registeredAt, 12 + stepIndex * 3),
      });
    });

    if (index < completedBilanCount) {
      userEvents.push({
        eventType: 'test_completed',
        entityType: 'bilan',
        entityId: 'bilan-v2',
        stepId: undefined,
        metadata: { ...baseMetadata, durationMs: 12 * 60_000 },
        occurredAt: addMinutes(registeredAt, 26),
      });
    } else {
      userEvents.push({
        eventType: 'test_abandoned',
        entityType: 'bilan',
        entityId: 'bilan-v2',
        stepId: 'demo-bilan-q18',
        metadata: { ...baseMetadata, answeredCount: 18, totalQuestions: 56 },
        occurredAt: addMinutes(registeredAt, 22),
      });
    }

    if (index < completedPersonalityCount) {
      userEvents.push(
        {
          eventType: 'test_started',
          entityType: 'personality',
          entityId: 'personality-v1',
          stepId: undefined,
          metadata: { ...baseMetadata, totalQuestions: 24 },
          occurredAt: addMinutes(registeredAt, 32),
        },
        {
          eventType: 'test_step_completed',
          entityType: 'personality',
          entityId: 'personality-v1',
          stepId: catalogs.personalityQuestions[3]?._id.toString(),
          metadata: {
            ...baseMetadata,
            stepIndex: 4,
            totalSteps: catalogs.personalityQuestions.length,
          },
          occurredAt: addMinutes(registeredAt, 35),
        },
        {
          eventType: 'test_completed',
          entityType: 'personality',
          entityId: 'personality-v1',
          stepId: undefined,
          metadata: { ...baseMetadata, durationMs: 8 * 60_000 },
          occurredAt: addMinutes(registeredAt, 41),
        }
      );
    }

    if (index < completedWorkStyleCount) {
      userEvents.push(
        {
          eventType: 'test_started',
          entityType: 'work_style',
          entityId: 'work-style-v1',
          stepId: undefined,
          metadata: { ...baseMetadata, totalQuestions: 16 },
          occurredAt: addMinutes(registeredAt, 44),
        },
        {
          eventType: 'test_step_completed',
          entityType: 'work_style',
          entityId: 'work-style-v1',
          stepId: catalogs.workStyleQuestions[2]?._id.toString(),
          metadata: {
            ...baseMetadata,
            stepIndex: 3,
            totalSteps: catalogs.workStyleQuestions.length,
          },
          occurredAt: addMinutes(registeredAt, 47),
        },
        {
          eventType: 'test_completed',
          entityType: 'work_style',
          entityId: 'work-style-v1',
          stepId: undefined,
          metadata: { ...baseMetadata, durationMs: 6 * 60_000 },
          occurredAt: addMinutes(registeredAt, 51),
        }
      );
    }

    swipes
      .filter((swipe) => swipe.userId.equals(user._id))
      .slice(0, 4)
      .forEach((swipe, swipeIndex) => {
        const job = jobs.find((item) => item._id.equals(swipe.jobId));
        userEvents.push({
          eventType: 'job_swiped',
          entityType: 'job',
          entityId: job?.code ?? swipe.jobId.toString(),
          stepId: undefined,
          metadata: {
            ...baseMetadata,
            action: swipe.action,
            jobTitle: job?.label,
            domain: job?.domain?.label,
          },
          occurredAt: addMinutes(registeredAt, 70 + swipeIndex * 9),
        });
      });

    return userEvents.map((event) => ({
      ...event,
      userHash,
      sessionId,
      source: 'mobile',
      receivedAt: event.occurredAt,
      appVersion,
    }));
  });

  await AnalyticsEvent.insertMany(events);

  return {
    seedBatch,
    demoEmailDomains,
    users: users.length,
    bilans: bilans.length,
    personalityTests: personalityTests.length,
    workStyleResults: workStyleResults.length,
    recommendationProfiles: profiles.length,
    swipes: swipes.length,
    matchingDecisions: matchingDecisions.length,
    supportRequests: supportMessages.length,
    analyticsEvents: events.length,
    period: {
      from: seedStart.toISOString(),
      to: seedEnd.toISOString(),
    },
  };
}
