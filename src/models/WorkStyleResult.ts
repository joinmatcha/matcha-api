import { Document, Model, Schema, Types, model } from 'mongoose';

import type { WorkStyleDimension } from '@/models/WorkStyleQuestion';

export type WorkStyleCompatibilityLevel = 'high' | 'medium' | 'low';

export type WorkStyleScores = Record<WorkStyleDimension, number>;

export interface WorkStyleResultProfile {
  key: string;
  title: string;
  description: string;
  strengths: string[];
  cautions: string[];
  advice: string[];
}

export interface WorkStyleAnswer {
  questionId: string;
  value: number;
}

export interface WorkStyleResultDocument extends Document {
  user: Types.ObjectId;
  versionId: Types.ObjectId;
  version: number;
  answers: WorkStyleAnswer[];
  scores: WorkStyleScores;
  topAxes: WorkStyleDimension[];
  profile: WorkStyleResultProfile;
  createdAt: Date;
  updatedAt: Date;
}

const WorkStyleAnswerSchema = new Schema<WorkStyleAnswer>(
  {
    questionId: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const WorkStyleProfileSchema = new Schema<WorkStyleResultProfile>(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    strengths: { type: [String], default: [] },
    cautions: { type: [String], default: [] },
    advice: { type: [String], default: [] },
  },
  { _id: false }
);

const WorkStyleResultSchema = new Schema<WorkStyleResultDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    versionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkStyleVersion',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, index: true },
    answers: { type: [WorkStyleAnswerSchema], default: [] },
    scores: { type: Schema.Types.Mixed, required: true },
    topAxes: { type: [String], default: [] },
    profile: { type: WorkStyleProfileSchema, required: true },
  },
  { timestamps: true }
);

WorkStyleResultSchema.index({ user: 1, createdAt: -1 });

export const WorkStyleResult: Model<WorkStyleResultDocument> =
  model<WorkStyleResultDocument>('WorkStyleResult', WorkStyleResultSchema);
