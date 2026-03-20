import { Document, Model, Schema, Types, model } from 'mongoose';

export interface PersonalityProfileDocument extends Document {
  versionId: Types.ObjectId;
  version: string;
  key: string;
  label: string;
  description?: string;
  strengths: string[];
  weaknesses: string[];
  recommendedJobs: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalityProfileSchema = new Schema<PersonalityProfileDocument>(
  {
    versionId: {
      type: Schema.Types.ObjectId,
      ref: 'PersonalityVersion',
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendedJobs: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

PersonalityProfileSchema.index({ version: 1, key: 1 }, { unique: true });

export const PersonalityProfile: Model<PersonalityProfileDocument> =
  model<PersonalityProfileDocument>(
    'PersonalityProfile',
    PersonalityProfileSchema
  );
