import { Document, Model, Schema, Types, model } from 'mongoose';

export type PersonalityDimension = 'EI' | 'SN' | 'TF' | 'JP';

interface PersonalityOption {
  value: number;
  label: string;
}

export interface PersonalityQuestionDocument extends Document {
  versionId: Types.ObjectId;
  version: string;
  code: string;
  text: string;
  dimension: PersonalityDimension;
  options: PersonalityOption[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalityOptionSchema = new Schema<PersonalityOption>(
  {
    value: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PersonalityQuestionSchema = new Schema<PersonalityQuestionDocument>(
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
    code: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    dimension: {
      type: String,
      enum: ['EI', 'SN', 'TF', 'JP'],
      required: true,
    },
    options: {
      type: [PersonalityOptionSchema],
      default: [],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

PersonalityQuestionSchema.index({ version: 1, code: 1 }, { unique: true });

export const PersonalityQuestion: Model<PersonalityQuestionDocument> =
  model<PersonalityQuestionDocument>(
    'PersonalityQuestion',
    PersonalityQuestionSchema
  );
