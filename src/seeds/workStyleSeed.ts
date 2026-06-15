import type { WorkStyleQuestionDocument } from '@/models/WorkStyleQuestion';
import type { WorkStyleDimension } from '@/models/WorkStyleQuestion';
import type { WorkStyleProfileDefinition } from '@/models/WorkStyleVersion';

export const workStyleSeedVersion = 1;

export const workStyleProfiles: WorkStyleProfileDefinition[] = [
  {
    key: 'autonomous_structured',
    title: 'Autonome structuré',
    description:
      'Tu avances mieux quand tu as un cadre clair, de l’autonomie et des objectifs lisibles.',
    strengths: [
      'Organisation personnelle',
      'Fiabilité dans la durée',
      'Capacité à avancer sans supervision constante',
    ],
    cautions: [
      'Un environnement trop flou peut te fatiguer',
      'Les interruptions fréquentes peuvent casser ton rythme',
    ],
    advice: [
      'Cherche des missions avec objectifs précis et marge de décision',
      'Clarifie les attentes avant de t’engager dans un projet',
    ],
    preferredAxes: ['autonomy', 'structure', 'learning'],
  },
  {
    key: 'collaborative_dynamic',
    title: 'Collaboratif dynamique',
    description:
      'Tu te nourris des échanges, du mouvement et des projets où l’énergie collective compte.',
    strengths: [
      'Communication',
      'Adaptation aux échanges',
      'Implication dans une dynamique d’équipe',
    ],
    cautions: [
      'Un poste trop isolé peut vite te démotiver',
      'Le manque de feedback peut te faire perdre en clarté',
    ],
    advice: [
      'Privilégie les environnements avec coopération régulière',
      'Vérifie le rythme d’équipe et la culture managériale',
    ],
    preferredAxes: ['collaboration', 'pace', 'human_contact'],
  },
  {
    key: 'versatile_explorer',
    title: 'Explorateur polyvalent',
    description:
      'Tu as besoin de variété, d’apprentissage et de situations qui te permettent d’élargir ton terrain de jeu.',
    strengths: ['Curiosité', 'Polyvalence', 'Capacité à apprendre vite'],
    cautions: [
      'Les tâches trop répétitives peuvent t’user',
      'Un cadre trop rigide peut limiter ton engagement',
    ],
    advice: [
      'Cherche des métiers avec projets variés ou montée en compétence',
      'Identifie les passerelles possibles avant de choisir une voie',
    ],
    preferredAxes: ['variety', 'learning', 'autonomy'],
  },
  {
    key: 'steady_methodical',
    title: 'Stable méthodique',
    description:
      'Tu donnes le meilleur dans un environnement posé, prévisible et bien organisé.',
    strengths: [
      'Rigueur',
      'Constance',
      'Attention aux méthodes et aux détails',
    ],
    cautions: [
      'Un rythme trop chaotique peut réduire ton efficacité',
      'Les changements permanents peuvent devenir coûteux',
    ],
    advice: [
      'Favorise les contextes structurés avec routines utiles',
      'Regarde les contraintes de rythme avant de choisir un métier',
    ],
    preferredAxes: ['structure', 'pace', 'collaboration'],
  },
  {
    key: 'field_relational',
    title: 'Terrain relationnel',
    description:
      'Tu préfères les situations concrètes, incarnées, avec du contact et une utilité visible.',
    strengths: ['Présence terrain', 'Relationnel', 'Sens du concret'],
    cautions: [
      'Un travail trop abstrait ou trop sédentaire peut te sembler vide',
      'Le contact permanent nécessite de préserver ton énergie',
    ],
    advice: [
      'Explore les métiers avec action concrète et lien humain',
      'Vérifie la part de terrain, de bureau et de relationnel',
    ],
    preferredAxes: ['mobility', 'human_contact', 'pace'],
  },
];

const version = workStyleSeedVersion;
type WorkStyleQuestionSeedTuple = [string, string, WorkStyleDimension, 1 | -1];

const workStyleQuestionTuples: WorkStyleQuestionSeedTuple[] = [
  [
    'AUT_1',
    'Je préfère organiser moi-même ma façon de travailler.',
    'autonomy',
    1,
  ],
  [
    'AUT_2',
    'J’aime avoir une marge de décision dans mes missions.',
    'autonomy',
    1,
  ],
  [
    'COL_1',
    'Je travaille mieux quand je peux échanger souvent avec une équipe.',
    'collaboration',
    1,
  ],
  [
    'COL_2',
    'Les projets collectifs me motivent davantage que les missions isolées.',
    'collaboration',
    1,
  ],
  [
    'PAC_1',
    'J’aime les journées rythmées où les choses avancent vite.',
    'pace',
    1,
  ],
  ['PAC_2', 'Un environnement trop lent me fait perdre en énergie.', 'pace', 1],
  [
    'STR_1',
    'J’ai besoin de règles et d’objectifs clairs pour être efficace.',
    'structure',
    1,
  ],
  [
    'STR_2',
    'Je préfère savoir précisément ce qui est attendu de moi.',
    'structure',
    1,
  ],
  ['VAR_1', 'La variété des tâches est importante pour moi.', 'variety', 1],
  ['VAR_2', 'J’aime alterner entre plusieurs types de missions.', 'variety', 1],
  [
    'HUM_1',
    'Le contact humain donne du sens à mon travail.',
    'human_contact',
    1,
  ],
  [
    'HUM_2',
    'J’aime aider, accompagner ou conseiller directement des personnes.',
    'human_contact',
    1,
  ],
  [
    'MOB_1',
    'Je préfère bouger ou être sur le terrain plutôt que rester au même endroit.',
    'mobility',
    1,
  ],
  [
    'MOB_2',
    'Les situations concrètes et pratiques me motivent.',
    'mobility',
    1,
  ],
  [
    'LEA_1',
    'J’ai besoin d’apprendre régulièrement de nouvelles choses.',
    'learning',
    1,
  ],
  [
    'LEA_2',
    'Je me projette mieux dans un métier qui permet d’évoluer.',
    'learning',
    1,
  ],
];

export const workStyleQuestions: Partial<WorkStyleQuestionDocument>[] =
  workStyleQuestionTuples.map(([code, text, dimension, polarity], index) => ({
    code,
    text,
    dimension,
    polarity,
    order: index + 1,
    version,
    isActive: true,
  }));
