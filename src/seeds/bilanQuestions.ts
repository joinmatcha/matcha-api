import type { BilanQuestionDocument } from '@/models/BilanQuestion';

export const bilanQuestionSeedVersion = 2;

const version = bilanQuestionSeedVersion;

export const bilanQuestions: Partial<BilanQuestionDocument>[] = [
  // Compétences transférables, 2 questions par axe.
  {
    code: 'C1',
    domain: 'competence',
    subdomain: 'analysis',
    question:
      'Je suis à l’aise pour analyser une situation complexe et en dégager l’essentiel.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C2',
    domain: 'competence',
    subdomain: 'analysis',
    question:
      'Je sais identifier les causes d’un problème et construire une solution logique.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C3',
    domain: 'competence',
    subdomain: 'organisation',
    question: 'Je planifie efficacement mon travail et respecte les délais.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C4',
    domain: 'competence',
    subdomain: 'organisation',
    question:
      'Je sais prioriser quand plusieurs tâches ou demandes arrivent en même temps.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C5',
    domain: 'competence',
    subdomain: 'communication',
    question:
      'J’explique clairement mes idées à l’oral, même sur des sujets complexes.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C6',
    domain: 'competence',
    subdomain: 'communication',
    question:
      'Je rédige des messages ou documents professionnels clairs et structurés.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C7',
    domain: 'competence',
    subdomain: 'creativity',
    question:
      'Je propose facilement des idées nouvelles ou des façons différentes de faire.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C8',
    domain: 'competence',
    subdomain: 'creativity',
    question:
      'Je sais adapter une solution existante à un contexte ou un besoin différent.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C9',
    domain: 'competence',
    subdomain: 'management',
    question:
      'Je suis à l’aise pour coordonner ou guider le travail d’autres personnes.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C10',
    domain: 'competence',
    subdomain: 'management',
    question:
      'Je sais prendre une décision, répartir les rôles et suivre l’avancement.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C11',
    domain: 'competence',
    subdomain: 'customer',
    question:
      'Je comprends les attentes d’un client, usager ou utilisateur et j’adapte ma réponse.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C12',
    domain: 'competence',
    subdomain: 'customer',
    question:
      'Je sais gérer une réclamation, une tension ou une demande sensible avec calme.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C13',
    domain: 'competence',
    subdomain: 'pedagogy',
    question:
      'Je transmets mes connaissances de manière compréhensible à d’autres personnes.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C14',
    domain: 'competence',
    subdomain: 'pedagogy',
    question:
      'Je sais accompagner quelqu’un pas à pas pour l’aider à progresser.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C15',
    domain: 'competence',
    subdomain: 'digital',
    question:
      'Je me sens à l’aise avec les outils numériques nécessaires à mon activité.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'C16',
    domain: 'competence',
    subdomain: 'digital',
    question:
      'J’apprends facilement à utiliser un nouveau logiciel, service en ligne ou outil digital.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },

  {
    code: 'SS1',
    domain: 'soft_skill',
    subdomain: 'stress',
    question:
      'En situation de pression, je garde généralement ma capacité de réflexion.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS2',
    domain: 'soft_skill',
    subdomain: 'autonomy',
    question:
      'Je suis capable de travailler de manière autonome sans supervision constante.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS3',
    domain: 'soft_skill',
    subdomain: 'teamwork',
    question:
      'J’apprécie travailler en équipe et je contribue positivement au collectif.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS4',
    domain: 'soft_skill',
    subdomain: 'teamwork',
    question: 'Je gère correctement les désaccords ou conflits dans un groupe.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS5',
    domain: 'soft_skill',
    subdomain: 'adaptability',
    question:
      'Je m’adapte facilement aux changements d’organisation ou de priorités.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS6',
    domain: 'soft_skill',
    subdomain: 'perseverance',
    question:
      'Je vais au bout des choses, même lorsque c’est long ou compliqué.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS7',
    domain: 'soft_skill',
    subdomain: 'confidence',
    question:
      'Je sais exprimer mes besoins, mes limites ou mes désaccords de manière respectueuse.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },
  {
    code: 'SS8',
    domain: 'soft_skill',
    subdomain: 'confidence',
    question: 'Je crois en mes capacités et je reconnais ce que je sais faire.',
    type: 'likert_1_5',
    version,
    isActive: true,
  },

  ...[
    [
      'V1',
      'autonomy',
      'L’autonomie dans mon travail est essentielle pour que je me sente bien.',
    ],
    [
      'V2',
      'stability',
      'La sécurité de l’emploi et un cadre stable sont très importants pour moi.',
    ],
    [
      'V3',
      'meaning',
      'J’ai besoin de sentir que mon travail a du sens et apporte quelque chose d’utile.',
    ],
    [
      'V4',
      'recognition',
      'La reconnaissance et les retours positifs sont un moteur important pour moi.',
    ],
    [
      'V5',
      'challenge',
      'J’aime être stimulé·e par des objectifs ambitieux ou des défis.',
    ],
    [
      'V6',
      'team_spirit',
      'L’ambiance de l’équipe et la qualité des relations comptent beaucoup pour moi.',
    ],
    [
      'V7',
      'learning',
      'Avoir des possibilités d’apprendre et de progresser est indispensable pour moi.',
    ],
    [
      'V8',
      'work_life_balance',
      'L’équilibre entre vie professionnelle et vie personnelle est une priorité pour moi.',
    ],
  ].map(([code, subdomain, question]) => ({
    code,
    domain: 'value' as const,
    subdomain,
    question,
    type: 'likert_1_5' as const,
    version,
    isActive: true,
  })),

  ...[
    [
      'WC1',
      'remote',
      'Le télétravail partiel ou total est important pour moi.',
    ],
    [
      'WC2',
      'rhythm',
      'Je préfère un rythme de travail prévisible et régulier.',
    ],
    [
      'WC3',
      'contact',
      'J’ai besoin de contacts fréquents avec d’autres personnes dans mon travail.',
    ],
    [
      'WC4',
      'management',
      'Je souhaite, à terme, encadrer ou manager d’autres personnes.',
    ],
    [
      'WC5',
      'physical_activity',
      'Je préfère un travail qui inclut des déplacements ou de l’activité physique.',
    ],
    [
      'WC6',
      'field_work',
      'Je suis attiré·e par des missions concrètes sur le terrain plutôt qu’uniquement derrière un bureau.',
    ],
  ].map(([code, subdomain, question]) => ({
    code,
    domain: 'work_condition' as const,
    subdomain,
    question,
    type: 'likert_1_5' as const,
    version,
    isActive: true,
  })),

  // RIASEC, 2 questions par dimension.
  ...[
    [
      'I1',
      'RIASEC_R',
      'J’aime les activités concrètes, pratiques, manuelles ou techniques.',
    ],
    ['I2', 'RIASEC_R', 'J’aime voir le résultat tangible de ce que je fais.'],
    [
      'I3',
      'RIASEC_I',
      'J’aime analyser, comprendre, explorer des idées, des données ou des systèmes.',
    ],
    [
      'I4',
      'RIASEC_I',
      'J’aime résoudre des problèmes qui demandent de la réflexion.',
    ],
    ['I5', 'RIASEC_A', 'J’apprécie les activités créatives ou d’expression.'],
    [
      'I6',
      'RIASEC_A',
      'J’aime imaginer des concepts, contenus, formes ou expériences nouvelles.',
    ],
    ['I7', 'RIASEC_S', 'J’aime aider, soutenir ou accompagner les autres.'],
    [
      'I8',
      'RIASEC_S',
      'J’aime créer du lien, écouter et comprendre les besoins des personnes.',
    ],
    [
      'I9',
      'RIASEC_E',
      'Je suis attiré·e par les projets où il faut convaincre, négocier ou entreprendre.',
    ],
    [
      'I10',
      'RIASEC_E',
      'J’aime prendre des initiatives et mobiliser d’autres personnes autour d’un objectif.',
    ],
    [
      'I11',
      'RIASEC_C',
      'Je me sens bien dans des environnements organisés, avec des procédures claires.',
    ],
    [
      'I12',
      'RIASEC_C',
      'J’aime classer, structurer, contrôler ou fiabiliser des informations.',
    ],
  ].map(([code, subdomain, question]) => ({
    code,
    domain: 'interest' as const,
    subdomain,
    question,
    type: 'likert_1_5' as const,
    version,
    isActive: true,
  })),

  // Faisabilité concrète d'une reconversion.
  ...[
    [
      'F1',
      'training_time',
      'Je peux consacrer du temps chaque semaine pour apprendre ou me former.',
    ],
    [
      'F2',
      'long_training',
      'Je peux envisager une formation de plusieurs mois si elle est utile à mon projet.',
    ],
    [
      'F3',
      'financial_flexibility',
      'Je peux accepter une période de transition avec un revenu temporairement moins confortable.',
    ],
    [
      'F4',
      'mobility',
      'Je peux envisager de me déplacer ou changer de zone géographique pour une opportunité adaptée.',
    ],
    [
      'F5',
      'junior_restart',
      'Je peux accepter de commencer plus junior dans un nouveau domaine pour progresser ensuite.',
    ],
    [
      'F6',
      'transition_speed',
      'J’ai besoin d’une transition rapide et concrète vers un nouveau métier.',
    ],
  ].map(([code, subdomain, question]) => ({
    code,
    domain: 'feasibility' as const,
    subdomain,
    question,
    type: 'likert_1_5' as const,
    version,
    isActive: true,
  })),
];
