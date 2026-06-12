export const BILAN_DOMAIN_LABELS: Record<string, string> = {
  competence: 'Compétences',
  soft_skill: 'Soft skills',
  value: 'Valeurs professionnelles',
  work_condition: 'Conditions de travail',
  interest: 'Centres d’intérêt',
  feasibility: 'Faisabilité de reconversion',
};

export const BILAN_SUBDOMAIN_LABELS: Record<string, Record<string, string>> = {
  competence: {
    analysis: 'Analyse',
    organisation: 'Organisation',
    communication: 'Communication',
    creativity: 'Créativité',
    management: 'Management',
    customer: 'Relation client',
    pedagogy: 'Transmission',
    digital: 'Compétences numériques',
  },

  soft_skill: {
    stress: 'Gestion du stress',
    autonomy: 'Autonomie',
    teamwork: 'Travail en équipe',
    adaptability: 'Adaptabilité',
    perseverance: 'Persévérance',
    confidence: 'Confiance en soi',
  },

  value: {
    autonomy: 'Autonomie',
    stability: 'Stabilité',
    meaning: 'Sens',
    recognition: 'Reconnaissance',
    challenge: 'Défi',
    team_spirit: 'Esprit d’équipe',
    learning: 'Apprentissage',
    work_life_balance: 'Équilibre vie pro / perso',
  },

  work_condition: {
    remote: 'Télétravail',
    rhythm: 'Rythme de travail',
    contact: 'Contact humain',
    management: 'Responsabilités managériales',
    physical_activity: 'Activité physique',
  },

  interest: {
    RIASEC_R: 'Réaliste',
    RIASEC_I: 'Investigateur',
    RIASEC_A: 'Artistique',
    RIASEC_S: 'Social',
    RIASEC_E: 'Entreprenant',
    RIASEC_C: 'Conventionnel',
  },

  feasibility: {
    training_time: 'Temps disponible pour se former',
    long_training: 'Ouverture à une formation longue',
    financial_flexibility: 'Flexibilité financière temporaire',
    mobility: 'Mobilité géographique',
    junior_restart: 'Ouverture à redémarrer junior',
    transition_speed: 'Besoin de transition rapide',
  },
};
