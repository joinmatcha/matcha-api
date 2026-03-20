import { Document, Model, Schema, model } from 'mongoose';

export type PersonalityVersionStatus = 'draft' | 'active' | 'archived';

export interface PersonalityVersionDocument extends Document {
  version: string;
  title: string;
  summary?: string;
  status: PersonalityVersionStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalityVersionSchema = new Schema<PersonalityVersionDocument>(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const PersonalityVersion: Model<PersonalityVersionDocument> =
  model<PersonalityVersionDocument>(
    'PersonalityVersion',
    PersonalityVersionSchema
  );
