import { Schema, Types, model } from 'mongoose';

export interface JobDocument {
  _id: Types.ObjectId;

  externalId?: string;
  source?: string;

  isActive: boolean;
  lastSyncedAt?: Date;

  title: string;
  description?: string;
  sector?: string;

  riasec: string[];

  competences: string[];
  softSkills: string[];

  values: string[];
  workConditions: string[];

  tags: string[];

  salaryMin?: number;
  salaryMax?: number;

  growthOutlook: 'stable' | 'growing' | 'declining' | 'unknown';

  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<JobDocument>(
  {
    externalId: String,
    source: String,

    isActive: { type: Boolean, default: true },
    lastSyncedAt: Date,

    title: { type: String, required: true },
    description: String,
    sector: String,

    riasec: { type: [String], default: [] },

    competences: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },

    values: { type: [String], default: [] },
    workConditions: { type: [String], default: [] },

    tags: { type: [String], default: [] },

    salaryMin: Number,
    salaryMax: Number,

    growthOutlook: {
      type: String,
      enum: ['stable', 'growing', 'declining', 'unknown'],
      default: 'unknown',
    },
  },
  { timestamps: true },
);

export const Job = model<JobDocument>('Job', JobSchema);
