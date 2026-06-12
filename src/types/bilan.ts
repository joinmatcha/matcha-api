export interface BilanArchetypeDTO {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface BilanRecommendedJobDTO {
  id: string;
  title: string;
  description?: string;
  sector?: string;
  score: number;
}

export interface BilanConclusionDTO {
  archetype: BilanArchetypeDTO;

  profileSummary: string;
  keyStrengths: string[];
  improvementAxes: string[];

  recommendedEnvironments: string[];
  recommendedJobs: BilanRecommendedJobDTO[];

  actionPlan: string[];
}

export interface BilanInvestigationDTO {
  topValues: string[];
  topWorkConditions: string[];
  interestsProfile: string[];
  feasibilityProfile?: string[];
}

export interface BilanResultDTO {
  id: string;
  version: number;
  createdAt: string;
  conclusion: BilanConclusionDTO;
  investigation: BilanInvestigationDTO;
}
