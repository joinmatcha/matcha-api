import { Job } from '@/models/Job';
import { GrowthOutlook } from '@/models/Job';

type JobSeed = {
  title: string;
  sector?: string;
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

export async function seedJobsV2() {
  await Job.deleteMany({});

  const jobs: JobSeed[] = [
    // ======================================================
    // TECH / IT / DATA
    // ======================================================
    {
      title: 'Développeur·se web',
      sector: 'Tech',
      description: 'Conçoit et développe des applications web.',
      riasec: ['RIASEC_I'],
      competences: ['analysis', 'digital'],
      softSkills: ['autonomy', 'perseverance'],
      values: ['learning', 'challenge'],
      workConditions: ['remote'],
      tags: ['web', 'frontend', 'backend'],
      missions: [
        'Développer des fonctionnalités web',
        'Maintenir et améliorer l’existant',
        'Collaborer avec produit et design',
      ],
      dailyTasks: ['Développement', 'Revue de code', 'Corrections de bugs'],
      evolutionPaths: [
        'Développeur·se senior',
        'Tech lead',
        'Architecte logiciel',
      ],
      salaryMin: 35000,
      salaryMax: 55000,
      growthOutlook: 'growing',
    },

    {
      title: 'DevOps / SRE',
      sector: 'Tech',
      description: 'Assure la fiabilité et la disponibilité des systèmes.',
      riasec: ['RIASEC_I', 'RIASEC_R'],
      competences: ['digital', 'analysis', 'organisation'],
      softSkills: ['perseverance', 'stress'],
      values: ['stability', 'challenge'],
      workConditions: ['remote'],
      tags: ['infra', 'cloud', 'ci-cd'],
      missions: [
        'Automatiser les déploiements',
        'Superviser les systèmes',
        'Améliorer la résilience',
      ],
      dailyTasks: ['Monitoring', 'Gestion incidents', 'Optimisation infra'],
      evolutionPaths: [
        'SRE senior',
        'Architecte cloud',
        'Responsable infrastructure',
      ],
      salaryMin: 42000,
      salaryMax: 70000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // DESIGN / CRÉATION
    // ======================================================
    {
      title: 'UX/UI Designer',
      sector: 'Design',
      description: 'Conçoit des interfaces centrées utilisateur.',
      riasec: ['RIASEC_A', 'RIASEC_I'],
      competences: ['creativity', 'analysis'],
      softSkills: ['communication', 'teamwork'],
      values: ['meaning', 'autonomy'],
      workConditions: ['remote'],
      tags: ['ux', 'ui', 'design'],
      missions: [
        'Concevoir des parcours utilisateurs',
        'Créer des prototypes',
        'Tester l’ergonomie',
      ],
      dailyTasks: ['Recherche utilisateur', 'Wireframes', 'Tests UX'],
      evolutionPaths: ['Product designer', 'Lead design'],
      salaryMin: 35000,
      salaryMax: 55000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // ARTISANAT / BTP
    // ======================================================
    {
      title: 'Électricien·ne bâtiment',
      sector: 'Artisanat',
      description: 'Installe et entretient les réseaux électriques.',
      riasec: ['RIASEC_R'],
      competences: ['analysis', 'organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['électricité', 'chantier'],
      missions: [
        'Installer des réseaux électriques',
        'Diagnostiquer des pannes',
      ],
      dailyTasks: ['Tirage de câbles', 'Pose équipements'],
      evolutionPaths: ['Chef·fe d’équipe', 'Artisan indépendant·e'],
      salaryMin: 24000,
      salaryMax: 38000,
      growthOutlook: 'growing',
    },

    {
      title: 'Maçon·ne',
      sector: 'BTP',
      description: 'Réalise les structures porteuses des bâtiments.',
      riasec: ['RIASEC_R'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity', 'outdoor'],
      tags: ['gros-oeuvre', 'chantier'],
      missions: ['Construire murs et dalles', 'Lire les plans'],
      dailyTasks: ['Préparation chantier', 'Coulage béton'],
      evolutionPaths: ['Chef·fe d’équipe', 'Chef·fe de chantier'],
      salaryMin: 22000,
      salaryMax: 35000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // SPORT / ACTIVITÉ PHYSIQUE
    // ======================================================
    {
      title: 'Coach sportif',
      sector: 'Sport',
      description: 'Accompagne des clients dans leur pratique sportive.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['pedagogy'],
      softSkills: ['communication', 'confidence'],
      values: ['meaning'],
      workConditions: ['physical_activity'],
      tags: ['sport', 'coaching'],
      missions: ['Élaborer des programmes sportifs', 'Encadrer les séances'],
      dailyTasks: ['Coaching clients', 'Suivi progression'],
      evolutionPaths: ['Préparateur physique', 'Responsable salle'],
      salaryMin: 22000,
      salaryMax: 40000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // ÉDUCATION
    // ======================================================
    {
      title: 'Professeur·e',
      sector: 'Éducation',
      description: 'Transmet des connaissances et accompagne les élèves.',
      riasec: ['RIASEC_S', 'RIASEC_I'],
      competences: ['communication', 'pedagogy'],
      softSkills: ['confidence'],
      values: ['meaning'],
      workConditions: ['contact'],
      tags: ['enseignement', 'éducation'],
      missions: ['Préparer les cours', 'Assurer l’enseignement'],
      dailyTasks: ['Cours', 'Corrections'],
      evolutionPaths: ['Formateur·rice', 'Direction établissement'],
      salaryMin: 25000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // SANTÉ / SOCIAL
    // ======================================================
    {
      title: 'Infirmier·e',
      sector: 'Santé',
      description: 'Assure les soins et le suivi des patients.',
      riasec: ['RIASEC_S', 'RIASEC_R'],
      competences: ['organisation', 'communication'],
      softSkills: ['stress', 'perseverance'],
      values: ['meaning'],
      workConditions: ['contact', 'physical_activity'],
      tags: ['santé', 'soins'],
      missions: ['Réaliser les soins', 'Surveiller l’état des patients'],
      dailyTasks: ['Soins', 'Transmission d’informations'],
      evolutionPaths: ['Infirmier·e spécialisé·e', 'Cadre de santé'],
      salaryMin: 28000,
      salaryMax: 42000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // BUSINESS / MARKETING / COMMERCE
    // ======================================================
    {
      title: 'Business developer',
      sector: 'Commerce',
      description:
        'Développe l’activité commerciale en identifiant de nouvelles opportunités et en construisant des relations clients.',
      riasec: ['RIASEC_E'],
      competences: ['communication', 'customer'],
      softSkills: ['confidence', 'perseverance'],
      values: ['challenge', 'recognition'],
      workConditions: ['contact'],
      tags: ['vente', 'prospection', 'négociation'],
      missions: [
        'Prospecter de nouveaux clients',
        'Négocier des contrats',
        'Développer le chiffre d’affaires',
      ],
      dailyTasks: [
        'Appels clients',
        'Rendez-vous commerciaux',
        'Suivi pipeline',
      ],
      evolutionPaths: [
        'Responsable commercial·e',
        'Directeur·rice commercial·e',
      ],
      salaryMin: 32000,
      salaryMax: 60000,
      growthOutlook: 'growing',
    },

    {
      title: 'Account manager',
      sector: 'Commerce',
      description:
        'Gère et développe un portefeuille clients existants en garantissant leur satisfaction.',
      riasec: ['RIASEC_E', 'RIASEC_S'],
      competences: ['customer', 'communication'],
      softSkills: ['adaptability'],
      values: ['team_spirit'],
      workConditions: ['contact'],
      tags: ['relation client', 'fidélisation'],
      missions: [
        'Suivre les clients existants',
        'Identifier de nouveaux besoins',
      ],
      dailyTasks: ['Échanges clients', 'Suivi contrats'],
      evolutionPaths: ['Key account manager', 'Responsable clientèle'],
      salaryMin: 30000,
      salaryMax: 55000,
      growthOutlook: 'growing',
    },

    {
      title: 'Responsable marketing',
      sector: 'Marketing',
      description:
        'Définit et pilote la stratégie marketing afin de développer la visibilité et la croissance.',
      riasec: ['RIASEC_E', 'RIASEC_A'],
      competences: ['communication', 'analysis', 'creativity'],
      softSkills: ['organisation'],
      values: ['challenge'],
      workConditions: ['contact'],
      tags: ['marketing', 'stratégie', 'campagnes'],
      missions: ['Définir la stratégie marketing', 'Piloter les campagnes'],
      dailyTasks: ['Analyse performance', 'Coordination équipes'],
      evolutionPaths: ['Directeur·rice marketing'],
      salaryMin: 38000,
      salaryMax: 65000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // PRODUIT / GESTION / PROJET
    // ======================================================
    {
      title: 'Chef·fe de projet',
      sector: 'Gestion',
      description:
        'Pilote des projets de bout en bout en coordonnant les acteurs et en respectant délais et budgets.',
      riasec: ['RIASEC_E', 'RIASEC_S'],
      competences: ['organisation', 'management'],
      softSkills: ['adaptability', 'communication'],
      values: ['recognition'],
      workConditions: ['management', 'contact'],
      tags: ['projet', 'coordination'],
      missions: ['Planifier le projet', 'Coordonner les parties prenantes'],
      dailyTasks: ['Réunions', 'Suivi planning'],
      evolutionPaths: ['PMO', 'Responsable projets'],
      salaryMin: 34000,
      salaryMax: 55000,
      growthOutlook: 'growing',
    },

    {
      title: 'Product owner',
      sector: 'Produit',
      description:
        'Définit et priorise les fonctionnalités produit en lien avec les besoins utilisateurs.',
      riasec: ['RIASEC_E', 'RIASEC_I'],
      competences: ['analysis', 'organisation', 'communication'],
      softSkills: ['adaptability', 'teamwork'],
      values: ['meaning', 'recognition'],
      workConditions: ['contact'],
      tags: ['produit', 'agile'],
      missions: ['Gérer le backlog', 'Recueillir les besoins utilisateurs'],
      dailyTasks: ['Rédaction user stories', 'Ateliers produit'],
      evolutionPaths: ['Product manager'],
      salaryMin: 38000,
      salaryMax: 60000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // RH / ACCOMPAGNEMENT / SOCIAL
    // ======================================================
    {
      title: 'Chargé·e de recrutement',
      sector: 'RH',
      description:
        'Identifie et recrute les talents en lien avec les besoins des équipes.',
      riasec: ['RIASEC_S', 'RIASEC_E'],
      competences: ['communication', 'analysis'],
      softSkills: ['confidence', 'adaptability'],
      values: ['team_spirit'],
      workConditions: ['contact'],
      tags: ['recrutement', 'talents'],
      missions: ['Sourcer les candidats', 'Conduire les entretiens'],
      dailyTasks: ['Entretiens', 'Tri de CV'],
      evolutionPaths: ['Responsable recrutement', 'HR business partner'],
      salaryMin: 28000,
      salaryMax: 45000,
      growthOutlook: 'growing',
    },

    {
      title: 'Coach professionnel',
      sector: 'Accompagnement',
      description:
        'Accompagne les individus dans leur développement professionnel et personnel.',
      riasec: ['RIASEC_S'],
      competences: ['pedagogy'],
      softSkills: ['communication', 'confidence'],
      values: ['meaning'],
      workConditions: ['contact'],
      tags: ['coaching', 'accompagnement'],
      missions: [
        'Accompagner les bénéficiaires',
        'Clarifier objectifs et leviers',
      ],
      dailyTasks: ['Séances coaching', 'Suivi progression'],
      evolutionPaths: ['Coach senior', 'Consultant·e'],
      salaryMin: 30000,
      salaryMax: 60000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // TERRAIN / LOGISTIQUE / TECHNIQUE
    // ======================================================
    {
      title: 'Technicien·ne de maintenance',
      sector: 'Industrie',
      description:
        'Assure la maintenance préventive et corrective des équipements.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['maintenance', 'terrain'],
      missions: ['Diagnostiquer les pannes', 'Effectuer les réparations'],
      dailyTasks: ['Interventions terrain', 'Contrôles équipements'],
      evolutionPaths: ['Chef·fe d’équipe', 'Responsable maintenance'],
      salaryMin: 24000,
      salaryMax: 38000,
      growthOutlook: 'stable',
    },

    {
      title: 'Logisticien·ne',
      sector: 'Logistique',
      description: 'Organise et optimise les flux de marchandises.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm', 'physical_activity'],
      tags: ['logistique', 'flux'],
      missions: ['Gérer les stocks', 'Optimiser les flux'],
      dailyTasks: ['Suivi livraisons', 'Gestion stocks'],
      evolutionPaths: ['Responsable logistique'],
      salaryMin: 25000,
      salaryMax: 40000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // NATURE / ENVIRONNEMENT
    // ======================================================
    {
      title: 'Paysagiste',
      sector: 'Environnement',
      description: 'Conçoit et entretient des espaces verts.',
      riasec: ['RIASEC_R'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'outdoor'],
      tags: ['nature', 'extérieur'],
      missions: ['Créer des espaces paysagers', 'Entretenir les plantations'],
      dailyTasks: ['Travaux extérieurs', 'Entretien espaces verts'],
      evolutionPaths: ['Chef·fe d’équipe', 'Entrepreneur·e'],
      salaryMin: 22000,
      salaryMax: 36000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // FINANCE / ADMINISTRATIF
    // ======================================================
    {
      title: 'Comptable',
      sector: 'Finance',
      description:
        'Assure la tenue des comptes et la conformité financière de l’entreprise.',
      riasec: ['RIASEC_C'],
      competences: ['organisation', 'analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['comptabilité', 'finance'],
      missions: ['Tenir la comptabilité', 'Préparer les clôtures'],
      dailyTasks: ['Saisie comptable', 'Rapprochements bancaires'],
      evolutionPaths: ['Chef·fe comptable', 'Responsable financier'],
      salaryMin: 26000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    {
      title: 'Assistant·e administratif·ve',
      sector: 'Administration',
      description: 'Assure le support administratif et organisationnel.',
      riasec: ['RIASEC_C', 'RIASEC_S'],
      competences: ['organisation', 'communication'],
      softSkills: ['adaptability'],
      values: ['stability'],
      workConditions: ['contact'],
      tags: ['administratif', 'organisation'],
      missions: ['Gérer les dossiers', 'Organiser l’agenda'],
      dailyTasks: ['Gestion documents', 'Accueil et coordination'],
      evolutionPaths: ['Office manager'],
      salaryMin: 23000,
      salaryMax: 35000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // SÉCURITÉ / SERVICE PUBLIC
    // ======================================================
    {
      title: 'Agent de sécurité',
      sector: 'Sécurité',
      description: 'Assure la sécurité des personnes et des biens.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['stress', 'perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['sécurité', 'surveillance'],
      missions: ['Surveiller les lieux', 'Prévenir les incidents'],
      dailyTasks: ['Rondes', 'Contrôle accès'],
      evolutionPaths: ['Chef·fe d’équipe sécurité'],
      salaryMin: 22000,
      salaryMax: 33000,
      growthOutlook: 'stable',
    },

    {
      title: 'Pompier·e',
      sector: 'Service public',
      description:
        'Intervient pour porter secours et lutter contre les sinistres.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['analysis'],
      softSkills: ['stress', 'perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity'],
      tags: ['urgence', 'secours'],
      missions: ['Intervenir en situation d’urgence', 'Secourir les personnes'],
      dailyTasks: ['Interventions', 'Entraînement'],
      evolutionPaths: ['Chef·fe d’agrès', 'Officier'],
      salaryMin: 24000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // RESTAURATION / HÔTELLERIE
    // ======================================================
    {
      title: 'Cuisinier·e',
      sector: 'Restauration',
      description: 'Prépare et réalise les plats dans le respect des normes.',
      riasec: ['RIASEC_R'],
      competences: ['organisation'],
      softSkills: ['stress', 'perseverance'],
      values: ['challenge'],
      workConditions: ['rhythm', 'physical_activity'],
      tags: ['cuisine', 'restauration'],
      missions: ['Préparer les plats', 'Gérer les stocks'],
      dailyTasks: ['Mise en place', 'Service'],
      evolutionPaths: ['Chef·fe de cuisine', 'Restaurateur·rice'],
      salaryMin: 22000,
      salaryMax: 40000,
      growthOutlook: 'stable',
    },

    {
      title: 'Serveur·se',
      sector: 'Restauration',
      description: 'Accueille et sert les clients.',
      riasec: ['RIASEC_S', 'RIASEC_R'],
      competences: ['communication'],
      softSkills: ['adaptability'],
      values: ['team_spirit'],
      workConditions: ['contact', 'rhythm'],
      tags: ['service', 'client'],
      missions: ['Accueillir les clients', 'Assurer le service'],
      dailyTasks: ['Prise commandes', 'Encaissement'],
      evolutionPaths: ['Maître d’hôtel', 'Responsable salle'],
      salaryMin: 21000,
      salaryMax: 32000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // TRANSPORT / MOBILITÉ
    // ======================================================
    {
      title: 'Chauffeur·se poids lourd',
      sector: 'Transport',
      description:
        'Assure le transport de marchandises en respectant les règles.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['transport', 'logistique'],
      missions: ['Transporter les marchandises', 'Respecter les délais'],
      dailyTasks: ['Conduite', 'Chargement'],
      evolutionPaths: ['Responsable flotte'],
      salaryMin: 24000,
      salaryMax: 38000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES POUR ÉQUILIBRER LE DATASET
    // ======================================================
    {
      title: 'Responsable qualité',
      sector: 'Industrie',
      description: 'Garantit la conformité des processus et produits.',
      riasec: ['RIASEC_C', 'RIASEC_I'],
      competences: ['analysis', 'organisation'],
      softSkills: ['communication'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['qualité', 'process'],
      missions: ['Définir les standards qualité', 'Piloter les audits'],
      dailyTasks: ['Analyse conformité', 'Reporting'],
      evolutionPaths: ['Directeur·rice qualité'],
      salaryMin: 35000,
      salaryMax: 55000,
      growthOutlook: 'stable',
    },

    {
      title: 'Responsable de site',
      sector: 'Opérations',
      description: 'Pilote l’activité quotidienne d’un site.',
      riasec: ['RIASEC_E', 'RIASEC_R'],
      competences: ['management', 'organisation'],
      softSkills: ['stress'],
      values: ['recognition'],
      workConditions: ['management', 'rhythm'],
      tags: ['management', 'terrain'],
      missions: ['Encadrer les équipes', 'Suivre la performance'],
      dailyTasks: ['Management', 'Pilotage indicateurs'],
      evolutionPaths: ['Directeur·rice d’exploitation'],
      salaryMin: 36000,
      salaryMax: 60000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES TECH / DATA
    // ======================================================
    {
      title: 'Développeur·se backend',
      sector: 'Tech',
      description: 'Conçoit des API et services robustes côté serveur.',
      riasec: ['RIASEC_I'],
      competences: ['analysis', 'digital'],
      softSkills: ['perseverance', 'organisation'],
      values: ['learning'],
      workConditions: ['remote'],
      tags: ['backend', 'api'],
      missions: [
        'Développer des services backend',
        'Garantir performance et sécurité',
      ],
      dailyTasks: ['Développement API', 'Optimisation requêtes'],
      evolutionPaths: ['Lead backend', 'Architecte logiciel'],
      salaryMin: 38000,
      salaryMax: 60000,
      growthOutlook: 'growing',
    },

    {
      title: 'Data analyst',
      sector: 'Data',
      description: 'Analyse les données afin d’éclairer les décisions.',
      riasec: ['RIASEC_I'],
      competences: ['analysis'],
      softSkills: ['organisation', 'communication'],
      values: ['meaning', 'learning'],
      workConditions: ['remote'],
      tags: ['data', 'analyse'],
      missions: ['Analyser les données', 'Produire des indicateurs'],
      dailyTasks: ['Requêtes', 'Dashboards'],
      evolutionPaths: ['Senior data analyst', 'Data scientist'],
      salaryMin: 35000,
      salaryMax: 55000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // VARIANTES DESIGN / CRÉATION
    // ======================================================
    {
      title: 'Graphiste',
      sector: 'Création',
      description: 'Crée des supports visuels pour différents médias.',
      riasec: ['RIASEC_A'],
      competences: ['creativity'],
      softSkills: ['organisation'],
      values: ['autonomy'],
      workConditions: ['remote'],
      tags: ['graphisme', 'création'],
      missions: ['Créer des visuels', 'Décliner les chartes graphiques'],
      dailyTasks: ['Création graphique', 'Retouches'],
      evolutionPaths: ['Directeur·rice artistique'],
      salaryMin: 28000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES RH / SOCIAL
    // ======================================================
    {
      title: 'Travailleur·se social·e',
      sector: 'Social',
      description: 'Accompagne des publics en difficulté.',
      riasec: ['RIASEC_S'],
      competences: ['communication'],
      softSkills: ['stress', 'perseverance'],
      values: ['meaning'],
      workConditions: ['contact'],
      tags: ['social', 'accompagnement'],
      missions: ['Accompagner les bénéficiaires', 'Coordonner les aides'],
      dailyTasks: ['Entretiens', 'Suivi dossiers'],
      evolutionPaths: ['Coordinateur·rice social·e'],
      salaryMin: 24000,
      salaryMax: 36000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES SPORT / BIEN-ÊTRE
    // ======================================================
    {
      title: 'Éducateur·rice sportif·ve',
      sector: 'Sport',
      description: 'Encadre des activités sportives et physiques.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['pedagogy'],
      softSkills: ['communication'],
      values: ['meaning'],
      workConditions: ['physical_activity'],
      tags: ['sport', 'éducation'],
      missions: ['Encadrer les activités sportives', 'Assurer la sécurité'],
      dailyTasks: ['Animation séances', 'Suivi participants'],
      evolutionPaths: ['Responsable sportif'],
      salaryMin: 23000,
      salaryMax: 38000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // VARIANTES TERRAIN / TECHNIQUE
    // ======================================================
    {
      title: 'Technicien·ne terrain',
      sector: 'Technique',
      description:
        'Intervient sur site pour installer ou réparer des équipements.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['terrain', 'intervention'],
      missions: ['Installer des équipements', 'Assurer la maintenance'],
      dailyTasks: ['Déplacements', 'Interventions'],
      evolutionPaths: ['Responsable technique'],
      salaryMin: 25000,
      salaryMax: 40000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES ÉDUCATION
    // ======================================================
    {
      title: 'Formateur·rice',
      sector: 'Formation',
      description: 'Conçoit et anime des formations professionnelles.',
      riasec: ['RIASEC_S'],
      competences: ['pedagogy', 'communication'],
      softSkills: ['teamwork'],
      values: ['learning', 'meaning'],
      workConditions: ['contact'],
      tags: ['formation', 'pédagogie'],
      missions: ['Concevoir les supports', 'Animer les sessions'],
      dailyTasks: ['Animation', 'Évaluation'],
      evolutionPaths: ['Responsable formation'],
      salaryMin: 30000,
      salaryMax: 50000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // VARIANTES RESTAURATION / SERVICE
    // ======================================================
    {
      title: 'Employé·e polyvalent·e de restauration',
      sector: 'Restauration',
      description: 'Participe à la préparation et au service.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['organisation'],
      softSkills: ['adaptability'],
      values: ['team_spirit'],
      workConditions: ['rhythm', 'physical_activity'],
      tags: ['restauration', 'service'],
      missions: ['Préparer les commandes', 'Servir les clients'],
      dailyTasks: ['Service', 'Nettoyage'],
      evolutionPaths: ['Responsable équipe'],
      salaryMin: 21000,
      salaryMax: 30000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES BUSINESS / MANAGEMENT
    // ======================================================
    {
      title: 'Responsable commercial·e',
      sector: 'Commerce',
      description:
        'Encadre une équipe commerciale et pilote la performance des ventes.',
      riasec: ['RIASEC_E'],
      competences: ['management', 'communication', 'customer'],
      softSkills: ['confidence'],
      values: ['recognition'],
      workConditions: ['management', 'contact'],
      tags: ['vente', 'management'],
      missions: [
        'Définir les objectifs commerciaux',
        'Encadrer l’équipe de vente',
      ],
      dailyTasks: ['Pilotage indicateurs', 'Coaching équipe'],
      evolutionPaths: ['Directeur·rice commercial·e'],
      salaryMin: 42000,
      salaryMax: 70000,
      growthOutlook: 'stable',
    },

    {
      title: 'Consultant·e',
      sector: 'Conseil',
      description:
        'Analyse les problématiques clients et propose des recommandations.',
      riasec: ['RIASEC_E', 'RIASEC_I'],
      competences: ['analysis', 'communication'],
      softSkills: ['adaptability'],
      values: ['challenge'],
      workConditions: ['contact'],
      tags: ['conseil', 'analyse'],
      missions: [
        'Analyser les besoins clients',
        'Formuler des recommandations',
      ],
      dailyTasks: ['Analyse', 'Restitution'],
      evolutionPaths: ['Consultant·e senior', 'Manager'],
      salaryMin: 38000,
      salaryMax: 65000,
      growthOutlook: 'stable',
    },

    {
      title: 'Entrepreneur·e',
      sector: 'Entrepreneuriat',
      description: 'Crée et développe une activité économique.',
      riasec: ['RIASEC_E'],
      competences: ['management', 'communication', 'analysis'],
      softSkills: ['perseverance', 'stress'],
      values: ['autonomy', 'challenge'],
      workConditions: ['rhythm'],
      tags: ['startup', 'entreprise'],
      missions: ['Définir la vision', 'Développer le business'],
      dailyTasks: ['Décisions stratégiques', 'Gestion opérationnelle'],
      evolutionPaths: ['Dirigeant·e'],
      salaryMin: 0,
      salaryMax: 100000,
      growthOutlook: 'unknown',
    },

    // ======================================================
    // VARIANTES ADMIN / FINANCE
    // ======================================================
    {
      title: 'Contrôleur·se de gestion',
      sector: 'Finance',
      description: 'Analyse la performance financière et aide à la décision.',
      riasec: ['RIASEC_C', 'RIASEC_I'],
      competences: ['analysis', 'organisation'],
      softSkills: ['communication'],
      values: ['meaning'],
      workConditions: ['rhythm'],
      tags: ['finance', 'performance'],
      missions: ['Analyser les résultats', 'Suivre les budgets'],
      dailyTasks: ['Reporting', 'Analyse écarts'],
      evolutionPaths: ['Responsable financier'],
      salaryMin: 36000,
      salaryMax: 55000,
      growthOutlook: 'stable',
    },

    {
      title: 'Gestionnaire paie',
      sector: 'Finance',
      description: 'Gère la paie et les déclarations sociales.',
      riasec: ['RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['paie', 'social'],
      missions: ['Établir les bulletins de paie', 'Gérer les déclarations'],
      dailyTasks: ['Traitement paie', 'Contrôles'],
      evolutionPaths: ['Responsable paie'],
      salaryMin: 26000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES LOGISTIQUE / TRANSPORT
    // ======================================================
    {
      title: 'Responsable transport',
      sector: 'Logistique',
      description:
        'Optimise les flux de transport et coordonne les prestataires.',
      riasec: ['RIASEC_R', 'RIASEC_E'],
      competences: ['organisation', 'management'],
      softSkills: ['stress'],
      values: ['recognition'],
      workConditions: ['rhythm'],
      tags: ['transport', 'logistique'],
      missions: ['Planifier les tournées', 'Piloter les prestataires'],
      dailyTasks: ['Suivi livraisons', 'Gestion incidents'],
      evolutionPaths: ['Directeur·rice logistique'],
      salaryMin: 38000,
      salaryMax: 60000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // VARIANTES NATURE / ENVIRONNEMENT
    // ======================================================
    {
      title: 'Agent·e d’entretien des espaces verts',
      sector: 'Environnement',
      description: 'Assure l’entretien et l’aménagement des espaces verts.',
      riasec: ['RIASEC_R'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'outdoor'],
      tags: ['nature', 'extérieur'],
      missions: ['Entretenir les espaces verts', 'Planter et tailler'],
      dailyTasks: ['Travaux extérieurs', 'Entretien'],
      evolutionPaths: ['Chef·fe d’équipe'],
      salaryMin: 22000,
      salaryMax: 34000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // VARIANTES SANTÉ / PARAMÉDICAL
    // ======================================================
    {
      title: 'Aide-soignant·e',
      sector: 'Santé',
      description: 'Assiste les patients dans les gestes du quotidien.',
      riasec: ['RIASEC_S', 'RIASEC_R'],
      competences: ['communication'],
      softSkills: ['perseverance', 'stress'],
      values: ['meaning'],
      workConditions: ['contact', 'physical_activity'],
      tags: ['soins', 'santé'],
      missions: ['Accompagner les patients', 'Assurer le confort'],
      dailyTasks: ['Soins de base', 'Aide quotidienne'],
      evolutionPaths: ['Infirmier·e'],
      salaryMin: 22000,
      salaryMax: 32000,
      growthOutlook: 'growing',
    },

    // ======================================================
    // VARIANTES ÉDUCATION / JEUNESSE
    // ======================================================
    {
      title: 'Animateur·rice socioculturel·le',
      sector: 'Éducation',
      description: 'Encadre des activités éducatives et culturelles.',
      riasec: ['RIASEC_S'],
      competences: ['communication', 'pedagogy'],
      softSkills: ['adaptability'],
      values: ['meaning'],
      workConditions: ['contact'],
      tags: ['animation', 'jeunesse'],
      missions: ['Animer des activités', 'Encadrer des groupes'],
      dailyTasks: ['Animation', 'Préparation activités'],
      evolutionPaths: ['Coordinateur·rice'],
      salaryMin: 22000,
      salaryMax: 34000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // SPORT / ACTIVITÉ PHYSIQUE
    // ======================================================
    {
      title: 'Coach sportif',
      sector: 'Sport',
      description:
        'Accompagne des clients dans l’atteinte de leurs objectifs physiques et de santé.',
      riasec: ['RIASEC_S', 'RIASEC_R'],
      competences: ['pedagogy', 'communication'],
      softSkills: ['confidence', 'perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'contact'],
      tags: ['sport', 'bien-être'],
      missions: [
        'Évaluer la condition physique',
        'Construire des programmes personnalisés',
      ],
      dailyTasks: ['Coaching séances', 'Suivi progression'],
      evolutionPaths: ['Préparateur·rice physique', 'Responsable de salle'],
      salaryMin: 24000,
      salaryMax: 45000,
      growthOutlook: 'growing',
    },

    {
      title: 'Éducateur·rice sportif·ve',
      sector: 'Sport',
      description:
        'Encadre des groupes et transmet les règles et valeurs sportives.',
      riasec: ['RIASEC_S', 'RIASEC_R'],
      competences: ['pedagogy'],
      softSkills: ['teamwork', 'confidence'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'contact'],
      tags: ['sport', 'éducation'],
      missions: ['Animer des séances sportives', 'Encadrer des groupes'],
      dailyTasks: ['Animation', 'Préparation séances'],
      evolutionPaths: ['Coordinateur·rice sportif·ve'],
      salaryMin: 22000,
      salaryMax: 36000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // ARTISANAT / MÉTIERS MANUELS
    // ======================================================
    {
      title: 'Électricien·ne',
      sector: 'Artisanat',
      description:
        'Installe et maintient des systèmes électriques dans des bâtiments.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity', 'outdoor'],
      tags: ['électricité', 'chantier'],
      missions: [
        'Installer des équipements électriques',
        'Diagnostiquer des pannes',
      ],
      dailyTasks: ['Interventions terrain', 'Maintenance'],
      evolutionPaths: ['Chef·fe d’équipe', 'Artisan indépendant'],
      salaryMin: 26000,
      salaryMax: 45000,
      growthOutlook: 'growing',
    },

    {
      title: 'Plombier·ère',
      sector: 'Artisanat',
      description: 'Installe et répare les réseaux d’eau et de chauffage.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['plomberie', 'bâtiment'],
      missions: ['Installer les équipements sanitaires', 'Réparer les fuites'],
      dailyTasks: ['Interventions clients', 'Dépannages'],
      evolutionPaths: ['Chef·fe d’équipe', 'Entreprise artisanale'],
      salaryMin: 26000,
      salaryMax: 48000,
      growthOutlook: 'growing',
    },

    {
      title: 'Menuisier·ère',
      sector: 'Artisanat',
      description: 'Fabrique et installe des éléments en bois.',
      riasec: ['RIASEC_R', 'RIASEC_A'],
      competences: ['creativity'],
      softSkills: ['perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity'],
      tags: ['bois', 'fabrication'],
      missions: ['Concevoir des pièces en bois', 'Installer sur site'],
      dailyTasks: ['Travail atelier', 'Pose chantier'],
      evolutionPaths: ['Chef·fe d’atelier'],
      salaryMin: 25000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // RESTAURATION / HÔTELLERIE
    // ======================================================
    {
      title: 'Cuisinier·ère',
      sector: 'Restauration',
      description: 'Prépare les plats et participe à l’élaboration des menus.',
      riasec: ['RIASEC_R', 'RIASEC_A'],
      competences: ['organisation'],
      softSkills: ['stress', 'perseverance'],
      values: ['challenge'],
      workConditions: ['rhythm', 'physical_activity'],
      tags: ['cuisine', 'restauration'],
      missions: ['Préparer les plats', 'Gérer les stocks'],
      dailyTasks: ['Préparation', 'Service'],
      evolutionPaths: ['Chef·fe de cuisine'],
      salaryMin: 22000,
      salaryMax: 38000,
      growthOutlook: 'stable',
    },

    {
      title: 'Serveur·se',
      sector: 'Restauration',
      description: 'Assure le service et la relation client en salle.',
      riasec: ['RIASEC_S'],
      competences: ['communication'],
      softSkills: ['stress'],
      values: ['team_spirit'],
      workConditions: ['rhythm', 'contact'],
      tags: ['service', 'client'],
      missions: ['Accueillir les clients', 'Servir les plats'],
      dailyTasks: ['Service', 'Encaissement'],
      evolutionPaths: ['Responsable de salle'],
      salaryMin: 21000,
      salaryMax: 30000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // SÉCURITÉ / SERVICE PUBLIC
    // ======================================================
    {
      title: 'Agent·e de sécurité',
      sector: 'Sécurité',
      description:
        'Assure la surveillance et la sécurité des personnes et des lieux.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['stress'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['sécurité', 'surveillance'],
      missions: ['Surveiller les lieux', 'Intervenir en cas d’incident'],
      dailyTasks: ['Rondes', 'Contrôles'],
      evolutionPaths: ['Chef·fe d’équipe sécurité'],
      salaryMin: 22000,
      salaryMax: 34000,
      growthOutlook: 'stable',
    },

    {
      title: 'Pompier·ère',
      sector: 'Sécurité',
      description:
        'Intervient lors d’incendies, accidents et situations d’urgence.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['organisation'],
      softSkills: ['stress', 'perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'rhythm'],
      tags: ['urgence', 'secours'],
      missions: ['Intervenir en urgence', 'Secourir les victimes'],
      dailyTasks: ['Interventions', 'Entraînement'],
      evolutionPaths: ['Chef·fe d’agrès'],
      salaryMin: 23000,
      salaryMax: 36000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // TRANSPORT / MOBILITÉ
    // ======================================================
    {
      title: 'Chauffeur·se poids lourd',
      sector: 'Transport',
      description:
        'Assure le transport de marchandises en respectant les délais et règles de sécurité.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm'],
      tags: ['transport', 'conduite'],
      missions: ['Transporter les marchandises', 'Contrôler le chargement'],
      dailyTasks: ['Conduite', 'Livraisons'],
      evolutionPaths: ['Responsable transport'],
      salaryMin: 26000,
      salaryMax: 40000,
      growthOutlook: 'stable',
    },

    {
      title: 'Conducteur·rice de bus',
      sector: 'Transport',
      description:
        'Transporte des passagers en garantissant sécurité et ponctualité.',
      riasec: ['RIASEC_R', 'RIASEC_S'],
      competences: ['organisation'],
      softSkills: ['stress'],
      values: ['stability'],
      workConditions: ['rhythm', 'contact'],
      tags: ['transport', 'service public'],
      missions: ['Conduire le bus', 'Accueillir les passagers'],
      dailyTasks: ['Conduite', 'Information voyageurs'],
      evolutionPaths: ['Formateur·rice conducteur·rice'],
      salaryMin: 24000,
      salaryMax: 36000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // INDUSTRIE / PRODUCTION
    // ======================================================
    {
      title: 'Opérateur·rice de production',
      sector: 'Industrie',
      description:
        'Assure la fabrication de produits selon les procédures établies.',
      riasec: ['RIASEC_R', 'RIASEC_C'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['rhythm', 'physical_activity'],
      tags: ['production', 'industrie'],
      missions: ['Produire selon les consignes', 'Contrôler la qualité'],
      dailyTasks: ['Fabrication', 'Contrôles'],
      evolutionPaths: ['Chef·fe d’équipe'],
      salaryMin: 22000,
      salaryMax: 33000,
      growthOutlook: 'stable',
    },

    {
      title: 'Responsable de production',
      sector: 'Industrie',
      description: 'Pilote la production et encadre les équipes industrielles.',
      riasec: ['RIASEC_E', 'RIASEC_R'],
      competences: ['management', 'organisation'],
      softSkills: ['stress'],
      values: ['recognition'],
      workConditions: ['management', 'rhythm'],
      tags: ['industrie', 'management'],
      missions: ['Planifier la production', 'Encadrer les équipes'],
      dailyTasks: ['Pilotage', 'Gestion incidents'],
      evolutionPaths: ['Directeur·rice industriel·le'],
      salaryMin: 42000,
      salaryMax: 65000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // ENVIRONNEMENT / NATURE (COMPLÉMENTS)
    // ======================================================
    {
      title: 'Paysagiste',
      sector: 'Environnement',
      description: 'Aménage et entretient des espaces extérieurs.',
      riasec: ['RIASEC_R', 'RIASEC_A'],
      competences: ['organisation'],
      softSkills: ['perseverance'],
      values: ['meaning'],
      workConditions: ['physical_activity', 'outdoor'],
      tags: ['nature', 'aménagement'],
      missions: ['Créer des espaces paysagers', 'Entretenir les sites'],
      dailyTasks: ['Travaux extérieurs', 'Plantations'],
      evolutionPaths: ['Chef·fe d’équipe paysagiste'],
      salaryMin: 23000,
      salaryMax: 38000,
      growthOutlook: 'stable',
    },

    // ======================================================
    // TERRAIN / MAINTENANCE
    // ======================================================
    {
      title: 'Agent·e de maintenance',
      sector: 'Technique',
      description:
        'Assure la maintenance préventive et curative des équipements.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['perseverance'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['maintenance', 'technique'],
      missions: ['Diagnostiquer les pannes', 'Effectuer les réparations'],
      dailyTasks: ['Maintenance', 'Dépannage'],
      evolutionPaths: ['Responsable maintenance'],
      salaryMin: 26000,
      salaryMax: 42000,
      growthOutlook: 'stable',
    },

    {
      title: 'Technicien·ne terrain',
      sector: 'Technique',
      description:
        'Intervient sur site pour installer ou réparer des équipements.',
      riasec: ['RIASEC_R'],
      competences: ['analysis'],
      softSkills: ['autonomy'],
      values: ['stability'],
      workConditions: ['physical_activity'],
      tags: ['terrain', 'intervention'],
      missions: ['Installer des équipements', 'Intervenir chez les clients'],
      dailyTasks: ['Déplacements', 'Interventions techniques'],
      evolutionPaths: ['Chef·fe d’équipe terrain'],
      salaryMin: 26000,
      salaryMax: 45000,
      growthOutlook: 'growing',
    },
  ];

  await Job.insertMany(jobs);

  console.log(`✅ Jobs seeded successfully: ${jobs.length} métiers`);
}
