import { Document, Model, Schema, Types, model } from 'mongoose';

export type RecommendationSource =
  | 'bilan'
  | 'personality'
  | 'work_style'
  | 'swipes';

export interface RecommendationSignal {
  key: string;
  label: string;
  weight: number;
  sources: string[];
}

export interface RecommendationProfileJob {
  jobId: Types.ObjectId;
  code: string;
  title: string;
  sector?: string;
  score: number;
  reasons: string[];
}

export interface RecommendationProfileDocument extends Document {
  user: Types.ObjectId;
  algorithmVersion: string;
  completedSources: RecommendationSource[];
  missingSources: RecommendationSource[];
  unlocked: boolean;
  sectors: RecommendationSignal[];
  interests: RecommendationSignal[];
  skills: RecommendationSignal[];
  workConditions: RecommendationSignal[];
  matchedJobs: RecommendationProfileJob[];
  recalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSignalSchema = new Schema<RecommendationSignal>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    weight: { type: Number, required: true },
    sources: { type: [String], default: [] },
  },
  { _id: false }
);

const RecommendationProfileJobSchema = new Schema<RecommendationProfileJob>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'RomeMetier',
      required: true,
    },
    code: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    score: { type: Number, required: true },
    reasons: { type: [String], default: [] },
  },
  { _id: false }
);

const RecommendationProfileSchema = new Schema<RecommendationProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    algorithmVersion: {
      type: String,
      required: true,
      default: 'profile-matching-v2',
    },
    completedSources: {
      type: [String],
      enum: ['bilan', 'personality', 'work_style', 'swipes'],
      default: [],
    },
    missingSources: {
      type: [String],
      enum: ['bilan', 'personality', 'work_style', 'swipes'],
      default: [],
    },
    unlocked: { type: Boolean, required: true, default: false },
    sectors: { type: [RecommendationSignalSchema], default: [] },
    interests: { type: [RecommendationSignalSchema], default: [] },
    skills: { type: [RecommendationSignalSchema], default: [] },
    workConditions: { type: [RecommendationSignalSchema], default: [] },
    matchedJobs: { type: [RecommendationProfileJobSchema], default: [] },
    recalculatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

RecommendationProfileSchema.index({ user: 1, recalculatedAt: -1 });

export const RecommendationProfile: Model<RecommendationProfileDocument> =
  model<RecommendationProfileDocument>(
    'RecommendationProfile',
    RecommendationProfileSchema
  );
