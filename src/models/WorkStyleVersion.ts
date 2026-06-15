import { Document, Model, Schema, model } from 'mongoose';

export type WorkStyleVersionStatus = 'draft' | 'active' | 'archived';

export interface WorkStyleProfileDefinition {
  key: string;
  title: string;
  description: string;
  strengths: string[];
  cautions: string[];
  advice: string[];
  preferredAxes: string[];
}

export interface WorkStyleVersionDocument extends Document {
  version: number;
  title: string;
  summary?: string;
  status: WorkStyleVersionStatus;
  isActive: boolean;
  profiles: WorkStyleProfileDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkStyleProfileSchema = new Schema<WorkStyleProfileDefinition>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    strengths: { type: [String], default: [] },
    cautions: { type: [String], default: [] },
    advice: { type: [String], default: [] },
    preferredAxes: { type: [String], default: [] },
  },
  { _id: false }
);

const WorkStyleVersionSchema = new Schema<WorkStyleVersionDocument>(
  {
    version: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    isActive: { type: Boolean, default: false, index: true },
    profiles: { type: [WorkStyleProfileSchema], default: [] },
  },
  { timestamps: true }
);

export const WorkStyleVersion: Model<WorkStyleVersionDocument> =
  model<WorkStyleVersionDocument>('WorkStyleVersion', WorkStyleVersionSchema);
