import { Document, Model, Schema, Types, model } from 'mongoose';

export type WorkStyleDimension =
  | 'autonomy'
  | 'collaboration'
  | 'pace'
  | 'structure'
  | 'variety'
  | 'human_contact'
  | 'mobility'
  | 'learning';

export interface WorkStyleQuestionDocument extends Document {
  versionId: Types.ObjectId;
  version: number;
  code: string;
  text: string;
  dimension: WorkStyleDimension;
  polarity: 1 | -1;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkStyleQuestionSchema = new Schema<WorkStyleQuestionDocument>(
  {
    versionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkStyleVersion',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, index: true },
    code: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    dimension: {
      type: String,
      required: true,
      enum: [
        'autonomy',
        'collaboration',
        'pace',
        'structure',
        'variety',
        'human_contact',
        'mobility',
        'learning',
      ],
      index: true,
    },
    polarity: { type: Number, enum: [1, -1], default: 1 },
    order: { type: Number, required: true, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

WorkStyleQuestionSchema.index({ version: 1, code: 1 }, { unique: true });
WorkStyleQuestionSchema.index({ version: 1, order: 1 });

export const WorkStyleQuestion: Model<WorkStyleQuestionDocument> =
  model<WorkStyleQuestionDocument>(
    'WorkStyleQuestion',
    WorkStyleQuestionSchema
  );
