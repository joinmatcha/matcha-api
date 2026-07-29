import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ScoreMaps {
  competence: Record<string, number>;
  soft_skill: Record<string, number>;
  value: Record<string, number>;
  work_condition: Record<string, number>;
  interest: Record<string, number>;
  feasibility: Record<string, number>;
}

export interface SkillClassification {
  strengths: string[]; // subdomains techniques (ex: "analysis")
  acquired: string[];
  toImprove: string[];
}

export interface InvestigationSection {
  competence: SkillClassification;
  softSkills: SkillClassification;
  topValues: string[]; // subdomains techniques
  topWorkConditions: string[]; // subdomains techniques
  interestsProfile: string[]; // ex: ["RIASEC_I", "RIASEC_A"]
  feasibilityProfile: string[];
}

interface ArchetypeSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface ConclusionSection {
  archetype: ArchetypeSection;

  profileSummary: string;
  keyStrengths: string[];
  improvementAxes: string[];

  recommendedSectors: string[];

  actionPlan: string[];
}

export interface BilanCompetenceDocument extends Document {
  user: Types.ObjectId;
  version: number;
  createdAt: Date;

  // audit / recalcul
  rawAnswers: {
    questionCode: string;
    valueNumber: number;
  }[];

  scores: ScoreMaps;
  investigation: InvestigationSection;
  conclusion: ConclusionSection;
}

const ScoreMapSchema = {
  type: Object,
  default: {},
};

const SkillClassificationSchema = new Schema(
  {
    strengths: { type: [String], default: [] },
    acquired: { type: [String], default: [] },
    toImprove: { type: [String], default: [] },
  },
  { _id: false }
);

const InvestigationSchema = new Schema(
  {
    competence: {
      type: SkillClassificationSchema,
      required: true,
      default: { strengths: [], acquired: [], toImprove: [] },
    },

    softSkills: {
      type: SkillClassificationSchema,
      required: true,
      default: { strengths: [], acquired: [], toImprove: [] },
    },

    topValues: { type: [String], default: [] },
    topWorkConditions: { type: [String], default: [] },
    interestsProfile: { type: [String], default: [] },
    feasibilityProfile: { type: [String], default: [] },
  },
  { _id: false }
);

const ArchetypeSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const ConclusionSchema = new Schema(
  {
    archetype: { type: ArchetypeSchema, required: true },

    profileSummary: { type: String, required: true },
    keyStrengths: { type: [String], default: [] },
    improvementAxes: { type: [String], default: [] },

    recommendedSectors: { type: [String], default: [] },

    actionPlan: { type: [String], default: [] },
  },
  { _id: false }
);

const BilanCompetenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true, default: 1 },

    rawAnswers: [
      {
        questionCode: { type: String, required: true },
        valueNumber: { type: Number, required: true, min: 1, max: 5 },
      },
    ],

    scores: {
      competence: ScoreMapSchema,
      soft_skill: ScoreMapSchema,
      value: ScoreMapSchema,
      work_condition: ScoreMapSchema,
      interest: ScoreMapSchema,
      feasibility: ScoreMapSchema,
    },

    investigation: {
      type: InvestigationSchema,
      required: true,
    },

    conclusion: {
      type: ConclusionSchema,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// historique des bilans
BilanCompetenceSchema.index({ user: 1, createdAt: -1 });

export const BilanCompetence: Model<BilanCompetenceDocument> =
  model<BilanCompetenceDocument>('BilanCompetence', BilanCompetenceSchema);
