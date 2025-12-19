import { Schema, Types, model } from 'mongoose';

export type GrowthOutlook = 'stable' | 'growing' | 'declining' | 'unknown';

export interface JobDocument {
  _id: Types.ObjectId;

  // --- synchronisation / source externe (optionnel)
  externalId?: string;
  source?: string;
  lastSyncedAt?: Date;

  // --- état
  isActive: boolean;

  // --- identité métier
  title: string;
  description?: string;
  sector?: string;

  // --- profil RIASEC (inspiré Holland)
  riasec: string[]; // ex: ['RIASEC_I', 'RIASEC_A']

  // --- profil requis
  competences: string[];
  softSkills: string[];
  values: string[];
  workConditions: string[];

  // --- enrichissement fiche métier
  tags: string[];

  missions?: string[];
  dailyTasks?: string[];
  evolutionPaths?: string[];

  // --- rémunération (indicatif)
  salaryMin?: number;
  salaryMax?: number;

  // --- marché de l’emploi
  growthOutlook: GrowthOutlook;

  // --- timestamps
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<JobDocument>(
  {
    // -------------------
    // Source / sync
    // -------------------
    externalId: String,
    source: String,
    lastSyncedAt: Date,

    // -------------------
    // État
    // -------------------
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // -------------------
    // Identité métier
    // -------------------
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: String,
    sector: {
      type: String,
      index: true,
    },

    // -------------------
    // RIASEC
    // -------------------
    riasec: {
      type: [String],
      default: [],
      index: true,
    },

    // -------------------
    // Profil requis
    // -------------------
    competences: {
      type: [String],
      default: [],
      index: true,
    },
    softSkills: {
      type: [String],
      default: [],
      index: true,
    },
    values: {
      type: [String],
      default: [],
      index: true,
    },
    workConditions: {
      type: [String],
      default: [],
      index: true,
    },

    // -------------------
    // Enrichissement fiche métier
    // -------------------
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    missions: {
      type: [String],
      default: [],
    },

    dailyTasks: {
      type: [String],
      default: [],
    },

    evolutionPaths: {
      type: [String],
      default: [],
    },

    // -------------------
    // Salaire (optionnel)
    // -------------------
    salaryMin: Number,
    salaryMax: Number,

    // -------------------
    // Marché de l’emploi
    // -------------------
    growthOutlook: {
      type: String,
      enum: ['stable', 'growing', 'declining', 'unknown'],
      default: 'unknown',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Job = model<JobDocument>('Job', JobSchema);
