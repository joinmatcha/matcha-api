import { BilanQuestionDocument } from '@/models/BilanQuestion';

export const bilanQuestions: Partial<BilanQuestionDocument>[] = [
  // ------------------------
  // EXPERIENCE (questions ouvertes)
  // ------------------------
  {
    code: 'EXP1',
    domain: 'experience',
    subdomain: 'last_role',
    question:
      'Décris ton dernier poste ou activité principale : quelles étaient tes missions principales ?',
    type: 'open_text',
    version: 1,
    isActive: true,
  },
  {
    code: 'EXP2',
    domain: 'experience',
    subdomain: 'achievement',
    question:
      'Parle d’une expérience dont tu es particulièrement fier·e : qu’as-tu réalisé concrètement ?',
    type: 'open_text',
    version: 1,
    isActive: true,
  },
  {
    code: 'EXP3',
    domain: 'experience',
    subdomain: 'difficulty',
    question:
      'Quelle a été la situation professionnelle la plus difficile que tu aies rencontrée ? Comment l’as-tu gérée ?',
    type: 'open_text',
    version: 1,
    isActive: true,
  },
  {
    code: 'EXP4',
    domain: 'experience',
    subdomain: 'trajectory',
    question:
      'Si tu regardes l’ensemble de ton parcours (études, emplois, projets), quel fil conducteur tu observes ?',
    type: 'open_text',
    version: 1,
    isActive: true,
  },

  // ------------------------
  // COMPETENCES (LIKERT)
  // ------------------------
  {
    code: 'C1',
    domain: 'competence',
    subdomain: 'analysis',
    question:
      'Je suis à l’aise pour analyser une situation complexe et en dégager l’essentiel.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C2',
    domain: 'competence',
    subdomain: 'analysis',
    question:
      'Je sais identifier rapidement les causes d’un problème et proposer des solutions.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C3',
    domain: 'competence',
    subdomain: 'organisation',
    question: 'Je planifie efficacement mon travail et respecte les délais.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C4',
    domain: 'competence',
    subdomain: 'organisation',
    question:
      'Je suis capable de gérer plusieurs tâches ou projets en parallèle sans me disperser.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C5',
    domain: 'competence',
    subdomain: 'communication',
    question:
      'J’explique clairement mes idées à l’oral, même sur des sujets complexes.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C6',
    domain: 'competence',
    subdomain: 'communication',
    question:
      'Je rédige des messages ou documents professionnels clairs et structurés.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C7',
    domain: 'competence',
    subdomain: 'creativity',
    question:
      'Je propose facilement des idées nouvelles ou des façons différentes de faire.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C8',
    domain: 'competence',
    subdomain: 'creativity',
    question:
      'Je sais adapter des solutions existantes pour les rendre plus efficaces.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C9',
    domain: 'competence',
    subdomain: 'management',
    question:
      'Je suis à l’aise pour coordonner ou guider le travail d’autres personnes.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C10',
    domain: 'competence',
    subdomain: 'management',
    question:
      'Je sais déléguer des tâches et suivre leur réalisation jusqu’au bout.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C11',
    domain: 'competence',
    subdomain: 'customer',
    question:
      'Je comprends bien les attentes d’un client ou utilisateur et j’adapte ma réponse en conséquence.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C12',
    domain: 'competence',
    subdomain: 'customer',
    question:
      'Je gère correctement les situations de mécontentement ou de réclamation.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C13',
    domain: 'competence',
    subdomain: 'pedagogy',
    question:
      'Je suis capable de transmettre mes connaissances à d’autres personnes de manière compréhensible.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'C14',
    domain: 'competence',
    subdomain: 'digital',
    question:
      'Je me sens à l’aise avec les outils numériques nécessaires à mon activité (logiciels, applications, outils en ligne…).',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },

  // ------------------------
  // SOFT SKILLS
  // ------------------------
  {
    code: 'SS1',
    domain: 'soft_skill',
    subdomain: 'stress',
    question:
      'En situation de pression, je reste globalement calme et je garde ma capacité de réflexion.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS2',
    domain: 'soft_skill',
    subdomain: 'autonomy',
    question:
      'Je suis capable de travailler de manière autonome sans supervision constante.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS3',
    domain: 'soft_skill',
    subdomain: 'teamwork',
    question:
      'J’apprécie travailler en équipe et je contribue positivement au collectif.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS4',
    domain: 'soft_skill',
    subdomain: 'teamwork',
    question: 'Je gère correctement les désaccords ou conflits dans un groupe.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS5',
    domain: 'soft_skill',
    subdomain: 'adaptability',
    question:
      'Je m’adapte relativement facilement aux changements d’organisation ou de priorités.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS6',
    domain: 'soft_skill',
    subdomain: 'perseverance',
    question:
      'Je vais au bout des choses, même lorsque c’est long ou compliqué.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS7',
    domain: 'soft_skill',
    subdomain: 'confidence',
    question:
      'Je suis capable d’exprimer mes besoins, mes limites ou mes désaccords de manière respectueuse.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'SS8',
    domain: 'soft_skill',
    subdomain: 'confidence',
    question: 'Je crois en mes capacités et je reconnais ce que je sais faire.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },

  // ------------------------
  // VALEURS PROFESSIONNELLES
  // ------------------------
  {
    code: 'V1',
    domain: 'value',
    subdomain: 'autonomy',
    question:
      'L’autonomie dans mon travail est essentielle pour que je me sente bien.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V2',
    domain: 'value',
    subdomain: 'stability',
    question:
      'La sécurité de l’emploi et un cadre stable sont très importants pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V3',
    domain: 'value',
    subdomain: 'meaning',
    question:
      'J’ai besoin de sentir que mon travail a du sens et apporte quelque chose d’utile.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V4',
    domain: 'value',
    subdomain: 'recognition',
    question:
      'La reconnaissance (feedback, valorisation, évolution) est un moteur important pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V5',
    domain: 'value',
    subdomain: 'challenge',
    question: 'J’aime être stimulé·e par des objectifs ambitieux ou des défis.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V6',
    domain: 'value',
    subdomain: 'team_spirit',
    question:
      'L’ambiance de l’équipe et la qualité des relations comptent beaucoup pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V7',
    domain: 'value',
    subdomain: 'learning',
    question:
      'Avoir des possibilités d’apprendre et de progresser est indispensable pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'V8',
    domain: 'value',
    subdomain: 'work_life_balance',
    question:
      'L’équilibre entre vie professionnelle et vie personnelle est une priorité pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },

  // ------------------------
  // CONDITIONS DE TRAVAIL
  // ------------------------
  {
    code: 'WC1',
    domain: 'work_condition',
    subdomain: 'remote',
    question: 'Le télétravail (partiel ou total) est important pour moi.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'WC2',
    domain: 'work_condition',
    subdomain: 'rhythm',
    question:
      'Je préfère un rythme de travail prévisible et régulier plutôt que très variable.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'WC3',
    domain: 'work_condition',
    subdomain: 'contact',
    question:
      'J’ai besoin d’avoir des contacts fréquents avec d’autres personnes dans mon travail.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'WC4',
    domain: 'work_condition',
    subdomain: 'management',
    question: 'Je souhaite, à terme, encadrer ou manager d’autres personnes.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'WC5',
    domain: 'work_condition',
    subdomain: 'physical_activity',
    question:
      'Je préfère un travail qui inclut des déplacements ou de l’activité physique plutôt qu’un poste entièrement sédentaire.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },

  // ------------------------
  // INTERÊTS (RIASEC)
  // ------------------------
  {
    code: 'I1',
    domain: 'interest',
    subdomain: 'RIASEC_R',
    question:
      'J’aime les activités concrètes, pratiques, manuelles ou techniques.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'I2',
    domain: 'interest',
    subdomain: 'RIASEC_I',
    question:
      'J’aime analyser, comprendre, explorer des idées, des données ou des systèmes.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'I3',
    domain: 'interest',
    subdomain: 'RIASEC_A',
    question:
      'J’apprécie les activités créatives ou d’expression (écriture, design, création artistique…).',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'I4',
    domain: 'interest',
    subdomain: 'RIASEC_S',
    question: 'J’aime aider, soutenir ou accompagner les autres.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'I5',
    domain: 'interest',
    subdomain: 'RIASEC_E',
    question:
      'Je suis attiré·e par les projets où il faut convaincre, négocier ou entreprendre.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
  {
    code: 'I6',
    domain: 'interest',
    subdomain: 'RIASEC_C',
    question:
      'Je me sens bien dans des environnements organisés, avec des procédures claires.',
    type: 'likert_1_5',
    version: 1,
    isActive: true,
  },
];
