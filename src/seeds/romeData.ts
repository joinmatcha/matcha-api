import { GrowthOutlook } from '@/models/Job';

export type RomeJobData = {
  romeCode: string;
  title: string;
  sector: string;
  description: string;
  riasec: string[];
  competences: string[];
  softSkills: string[];
  values: string[];
  workConditions: string[];
  tags: string[];
  missions: string[];
  dailyTasks: string[];
  evolutionPaths: string[];
  salaryMin?: number;
  salaryMax?: number;
  growthOutlook: GrowthOutlook;
};

export const romeJobs: RomeJobData[] = [
  // ======================================================
  // TECH / INFORMATIQUE
  // ======================================================
  {
    romeCode: 'M1805',
    title: 'Développeur·se / Analyste',
    sector: 'Tech',
    description:
      'Conçoit, développe et maintient des applications informatiques en répondant aux besoins fonctionnels et techniques.',
    riasec: ['RIASEC_I', 'RIASEC_R'],
    competences: ['analysis', 'digital'],
    softSkills: ['autonomy', 'perseverance'],
    values: ['learning', 'challenge'],
    workConditions: ['remote'],
    tags: ['développement', 'logiciel', 'tech'],
    missions: [
      'Analyser les besoins et spécifications',
      'Développer et tester les fonctionnalités',
      'Maintenir et optimiser les applications',
    ],
    dailyTasks: ['Développement', 'Revue de code', 'Correction de bugs'],
    evolutionPaths: ['Lead développeur·se', 'Architecte logiciel', 'CTO'],
    salaryMin: 32000,
    salaryMax: 65000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'M1810',
    title: "Production et exploitation de systèmes d'information",
    sector: 'Tech',
    description:
      "Assure le fonctionnement, la disponibilité et la performance des systèmes d'information en production.",
    riasec: ['RIASEC_I', 'RIASEC_R'],
    competences: ['digital', 'analysis', 'organisation'],
    softSkills: ['perseverance', 'stress'],
    values: ['stability', 'challenge'],
    workConditions: ['remote', 'rhythm'],
    tags: ['infra', 'production', 'systèmes'],
    missions: [
      'Superviser les systèmes en production',
      'Automatiser les déploiements',
      'Gérer les incidents',
    ],
    dailyTasks: ['Monitoring', 'Gestion incidents', 'Automatisation'],
    evolutionPaths: [
      'SRE senior',
      'Architecte cloud',
      'Responsable infrastructure',
    ],
    salaryMin: 38000,
    salaryMax: 70000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'M1806',
    title: "Consultant·e en systèmes d'information",
    sector: 'Tech',
    description:
      'Accompagne les organisations dans la définition et la mise en œuvre de leurs projets informatiques.',
    riasec: ['RIASEC_I', 'RIASEC_E'],
    competences: ['analysis', 'communication', 'organisation'],
    softSkills: ['adaptability', 'communication'],
    values: ['challenge', 'recognition'],
    workConditions: ['contact', 'management'],
    tags: ['conseil', 'SI', 'transformation'],
    missions: [
      'Analyser les besoins métiers',
      'Rédiger des cahiers des charges',
      'Piloter les projets IT',
    ],
    dailyTasks: ['Ateliers clients', 'Rédaction de specs', 'Suivi projets'],
    evolutionPaths: ['Manager consulting', 'Directeur·rice de projet'],
    salaryMin: 40000,
    salaryMax: 75000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'M1801',
    title: 'Administrateur·rice systèmes et réseaux',
    sector: 'Tech',
    description:
      "Installe, configure et maintient les équipements et logiciels systèmes et réseaux de l'organisation.",
    riasec: ['RIASEC_I', 'RIASEC_R'],
    competences: ['digital', 'analysis'],
    softSkills: ['perseverance', 'autonomy'],
    values: ['stability'],
    workConditions: ['remote'],
    tags: ['réseaux', 'systèmes', 'infrastructure'],
    missions: [
      'Administrer les serveurs et réseaux',
      'Assurer la sécurité des accès',
      'Maintenir la disponibilité des services',
    ],
    dailyTasks: [
      'Administration serveurs',
      'Gestion utilisateurs',
      'Supervision',
    ],
    evolutionPaths: ['Responsable infrastructure', 'Architecte réseau'],
    salaryMin: 30000,
    salaryMax: 55000,
    growthOutlook: 'growing',
  },

  // ======================================================
  // DESIGN / COMMUNICATION
  // ======================================================
  {
    romeCode: 'E1103',
    title: 'Concepteur·rice / Directeur·rice artistique',
    sector: 'Design',
    description:
      'Définit et supervise la direction créative de projets de communication visuelle.',
    riasec: ['RIASEC_A', 'RIASEC_E'],
    competences: ['creativity', 'management'],
    softSkills: ['confidence', 'communication'],
    values: ['autonomy', 'recognition'],
    workConditions: ['remote', 'management'],
    tags: ['direction artistique', 'création', 'visuel'],
    missions: [
      'Définir la direction créative',
      'Superviser la production graphique',
      'Garantir la cohérence visuelle',
    ],
    dailyTasks: [
      'Briefs créatifs',
      'Validation maquettes',
      'Coordination équipe',
    ],
    evolutionPaths: ['Directeur·rice de création', 'Fondateur·rice studio'],
    salaryMin: 38000,
    salaryMax: 65000,
    growthOutlook: 'stable',
  },
  {
    romeCode: 'B1603',
    title: 'Designer graphique',
    sector: 'Design',
    description:
      'Crée des supports visuels imprimés et numériques pour répondre à des besoins de communication.',
    riasec: ['RIASEC_A'],
    competences: ['creativity'],
    softSkills: ['organisation', 'communication'],
    values: ['autonomy', 'meaning'],
    workConditions: ['remote'],
    tags: ['graphisme', 'design', 'création visuelle'],
    missions: [
      'Créer des identités visuelles',
      'Concevoir des supports print et digital',
      'Décliner les chartes graphiques',
    ],
    dailyTasks: ['Création graphique', 'Retouche', 'Mise en page'],
    evolutionPaths: ['Directeur·rice artistique', 'Designer indépendant·e'],
    salaryMin: 26000,
    salaryMax: 45000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // COMMERCE / VENTE
  // ======================================================
  {
    romeCode: 'D1402',
    title: 'Responsable développement commercial',
    sector: 'Commerce',
    description:
      "Développe le chiffre d'affaires en prospectant de nouveaux clients et en fidélisant le portefeuille existant.",
    riasec: ['RIASEC_E'],
    competences: ['customer', 'communication'],
    softSkills: ['confidence', 'perseverance'],
    values: ['challenge', 'recognition'],
    workConditions: ['contact'],
    tags: ['vente', 'prospection', 'commercial'],
    missions: [
      'Prospecter de nouveaux marchés',
      'Négocier et conclure des contrats',
      'Fidéliser le portefeuille clients',
    ],
    dailyTasks: [
      'Rendez-vous clients',
      'Proposition commerciale',
      'Suivi pipeline',
    ],
    evolutionPaths: [
      'Directeur·rice commercial·e',
      'Directeur·rice régional·e',
    ],
    salaryMin: 32000,
    salaryMax: 65000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'D1501',
    title: 'Animateur·rice des ventes',
    sector: 'Commerce',
    description:
      'Anime et motive les équipes de vente pour atteindre les objectifs commerciaux.',
    riasec: ['RIASEC_E', 'RIASEC_S'],
    competences: ['communication', 'management'],
    softSkills: ['confidence', 'teamwork'],
    values: ['team_spirit', 'recognition'],
    workConditions: ['contact', 'management'],
    tags: ['animation', 'vente', 'équipe commerciale'],
    missions: [
      'Animer et motiver les équipes',
      'Former aux techniques de vente',
      'Suivre les indicateurs de performance',
    ],
    dailyTasks: ['Réunions équipe', 'Accompagnement terrain', 'Reporting'],
    evolutionPaths: ['Responsable commercial·e', 'Directeur·rice des ventes'],
    salaryMin: 30000,
    salaryMax: 55000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // RESSOURCES HUMAINES
  // ======================================================
  {
    romeCode: 'M1501',
    title: 'Assistant·e / Chargé·e de ressources humaines',
    sector: 'RH',
    description:
      'Assure les activités administratives et opérationnelles de la fonction RH.',
    riasec: ['RIASEC_S', 'RIASEC_C'],
    competences: ['organisation', 'communication'],
    softSkills: ['adaptability', 'confidence'],
    values: ['team_spirit'],
    workConditions: ['contact'],
    tags: ['RH', 'administratif', 'personnel'],
    missions: [
      "Gérer l'administration du personnel",
      'Accompagner les recrutements',
      'Assurer le suivi de la formation',
    ],
    dailyTasks: ['Gestion dossiers', 'Entretiens', 'Suivi administratif'],
    evolutionPaths: ['Responsable RH', 'HR Business Partner'],
    salaryMin: 26000,
    salaryMax: 42000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'M1502',
    title: 'Responsable développement des ressources humaines',
    sector: 'RH',
    description:
      'Pilote la politique de développement RH : recrutement, formation, mobilité et gestion des talents.',
    riasec: ['RIASEC_S', 'RIASEC_E'],
    competences: ['management', 'communication', 'organisation'],
    softSkills: ['confidence', 'stress'],
    values: ['meaning', 'recognition'],
    workConditions: ['management', 'contact'],
    tags: ['développement RH', 'talents', 'formation'],
    missions: [
      'Définir la politique talents',
      'Piloter le plan de formation',
      'Accompagner les mobilités',
    ],
    dailyTasks: ['Entretiens annuels', 'Comités talents', 'Suivi formations'],
    evolutionPaths: ['DRH', 'Directeur·rice du développement'],
    salaryMin: 42000,
    salaryMax: 70000,
    growthOutlook: 'growing',
  },

  // ======================================================
  // SANTÉ / SOCIAL
  // ======================================================
  {
    romeCode: 'J1506',
    title: 'Infirmier·e',
    sector: 'Santé',
    description:
      "Dispense des soins infirmiers, surveille l'état de santé des patients et coordonne leur prise en charge.",
    riasec: ['RIASEC_S', 'RIASEC_R'],
    competences: ['organisation', 'communication'],
    softSkills: ['stress', 'perseverance'],
    values: ['meaning'],
    workConditions: ['contact', 'physical_activity', 'rhythm'],
    tags: ['soins', 'santé', 'paramédical'],
    missions: [
      'Réaliser les soins prescrits',
      "Surveiller l'état des patients",
      "Coordonner avec l'équipe soignante",
    ],
    dailyTasks: ['Soins', 'Transmissions', 'Surveillance patients'],
    evolutionPaths: ['Infirmier·e spécialisé·e', 'Cadre de santé', 'IADE'],
    salaryMin: 28000,
    salaryMax: 45000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'K1201',
    title: 'Action sociale et familiale',
    sector: 'Social',
    description:
      'Accompagne des personnes en difficulté dans leurs démarches et leur insertion sociale et professionnelle.',
    riasec: ['RIASEC_S'],
    competences: ['communication'],
    softSkills: ['perseverance', 'stress', 'confidence'],
    values: ['meaning'],
    workConditions: ['contact'],
    tags: ['social', 'insertion', 'accompagnement'],
    missions: [
      'Accompagner les bénéficiaires',
      "Instruire les demandes d'aide",
      'Coordonner les partenaires',
    ],
    dailyTasks: [
      'Entretiens',
      'Suivi de dossiers',
      'Démarches administratives',
    ],
    evolutionPaths: ['Coordinateur·rice social·e', 'Responsable secteur'],
    salaryMin: 24000,
    salaryMax: 38000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // ÉDUCATION / FORMATION
  // ======================================================
  {
    romeCode: 'K2104',
    title: 'Enseignant·e / Formateur·rice',
    sector: 'Éducation',
    description:
      'Transmet des savoirs et des compétences, conçoit des progressions pédagogiques adaptées aux publics.',
    riasec: ['RIASEC_S', 'RIASEC_I'],
    competences: ['pedagogy', 'communication'],
    softSkills: ['confidence', 'adaptability'],
    values: ['meaning', 'learning'],
    workConditions: ['contact'],
    tags: ['enseignement', 'pédagogie', 'formation'],
    missions: [
      'Préparer et animer les cours',
      'Évaluer les apprenants',
      'Accompagner la progression',
    ],
    dailyTasks: ['Cours', 'Préparation', 'Corrections'],
    evolutionPaths: ['Formateur·rice expert·e', 'Responsable pédagogique'],
    salaryMin: 25000,
    salaryMax: 50000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // GESTION / FINANCE
  // ======================================================
  {
    romeCode: 'M1204',
    title: 'Contrôle de gestion et audit financier',
    sector: 'Finance',
    description:
      'Analyse la performance financière, contrôle les budgets et éclaire les décisions de direction.',
    riasec: ['RIASEC_C', 'RIASEC_I'],
    competences: ['analysis', 'organisation'],
    softSkills: ['communication', 'perseverance'],
    values: ['meaning', 'stability'],
    workConditions: ['rhythm'],
    tags: ['finance', 'contrôle de gestion', 'audit'],
    missions: [
      'Élaborer les budgets et forecasts',
      'Analyser les écarts',
      'Produire les reportings',
    ],
    dailyTasks: ['Analyse financière', 'Reporting', 'Réunions de gestion'],
    evolutionPaths: ['Directeur·rice financier·ère', 'CFO'],
    salaryMin: 36000,
    salaryMax: 65000,
    growthOutlook: 'stable',
  },
  {
    romeCode: 'M1203',
    title: 'Comptable',
    sector: 'Finance',
    description:
      'Assure la tenue de la comptabilité générale et la fiabilité des états financiers.',
    riasec: ['RIASEC_C'],
    competences: ['organisation', 'analysis'],
    softSkills: ['perseverance'],
    values: ['stability'],
    workConditions: ['rhythm'],
    tags: ['comptabilité', 'finance', 'clôture'],
    missions: [
      'Tenir la comptabilité générale',
      'Préparer les clôtures',
      'Assurer la conformité fiscale',
    ],
    dailyTasks: ['Saisie comptable', 'Rapprochements', 'Déclarations'],
    evolutionPaths: ['Chef·fe comptable', 'Responsable financier·ère'],
    salaryMin: 26000,
    salaryMax: 45000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // LOGISTIQUE / INDUSTRIE
  // ======================================================
  {
    romeCode: 'N1301',
    title: 'Responsable logistique',
    sector: 'Logistique',
    description:
      "Pilote et optimise les flux logistiques depuis l'approvisionnement jusqu'à la livraison client.",
    riasec: ['RIASEC_R', 'RIASEC_E'],
    competences: ['organisation', 'management'],
    softSkills: ['stress', 'perseverance'],
    values: ['stability', 'recognition'],
    workConditions: ['management', 'rhythm'],
    tags: ['logistique', 'supply chain', 'flux'],
    missions: [
      'Optimiser les flux de marchandises',
      'Piloter les prestataires',
      'Encadrer les équipes logistiques',
    ],
    dailyTasks: ['Suivi livraisons', 'Gestion stocks', 'Pilotage indicateurs'],
    evolutionPaths: ['Directeur·rice logistique', 'Supply chain manager'],
    salaryMin: 38000,
    salaryMax: 65000,
    growthOutlook: 'growing',
  },
  {
    romeCode: 'H1206',
    title: 'Ingénieur·e / Responsable qualité industrielle',
    sector: 'Industrie',
    description:
      'Définit et pilote la politique qualité, garantit la conformité des produits et processus.',
    riasec: ['RIASEC_C', 'RIASEC_I'],
    competences: ['analysis', 'organisation'],
    softSkills: ['communication', 'perseverance'],
    values: ['stability'],
    workConditions: ['rhythm'],
    tags: ['qualité', 'industrie', 'process'],
    missions: [
      'Définir les standards qualité',
      'Piloter les audits internes',
      'Traiter les non-conformités',
    ],
    dailyTasks: ['Contrôles qualité', 'Audits', 'Analyse causes'],
    evolutionPaths: ['Directeur·rice qualité', 'Responsable HSE'],
    salaryMin: 35000,
    salaryMax: 60000,
    growthOutlook: 'stable',
  },

  // ======================================================
  // GESTION DE PROJET
  // ======================================================
  {
    romeCode: 'M1302',
    title: 'Direction de projet',
    sector: 'Gestion',
    description:
      'Pilote des projets complexes de bout en bout, coordonne les parties prenantes et sécurise les livrables.',
    riasec: ['RIASEC_E', 'RIASEC_S'],
    competences: ['organisation', 'management', 'communication'],
    softSkills: ['adaptability', 'stress'],
    values: ['recognition', 'challenge'],
    workConditions: ['management', 'contact'],
    tags: ['gestion de projet', 'pilotage', 'coordination'],
    missions: [
      'Cadrer et planifier le projet',
      'Coordonner les équipes et prestataires',
      'Gérer les risques et les délais',
    ],
    dailyTasks: [
      'Réunions de pilotage',
      'Suivi planning',
      'Reporting avancement',
    ],
    evolutionPaths: ['PMO', 'Directeur·rice de programme', 'DSI'],
    salaryMin: 42000,
    salaryMax: 75000,
    growthOutlook: 'growing',
  },

  // ======================================================
  // ENVIRONNEMENT / DÉVELOPPEMENT DURABLE
  // ======================================================
  {
    romeCode: 'A1303',
    title: 'Ingénieur·e en environnement',
    sector: 'Environnement',
    description:
      'Analyse les impacts environnementaux et accompagne la transition écologique des organisations.',
    riasec: ['RIASEC_I', 'RIASEC_R'],
    competences: ['analysis', 'organisation'],
    softSkills: ['communication', 'perseverance'],
    values: ['meaning'],
    workConditions: ['outdoor', 'contact'],
    tags: ['environnement', 'développement durable', 'RSE'],
    missions: [
      'Réaliser des diagnostics environnementaux',
      "Proposer des plans d'action",
      'Accompagner la conformité réglementaire',
    ],
    dailyTasks: ['Mesures terrain', 'Rédaction rapports', 'Sensibilisation'],
    evolutionPaths: ['Responsable RSE', 'Directeur·rice développement durable'],
    salaryMin: 32000,
    salaryMax: 58000,
    growthOutlook: 'growing',
  },
];
