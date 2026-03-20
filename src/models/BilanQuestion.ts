import { Document, Model, Schema, model } from 'mongoose';

export type BilanQuestionDomain =
  | 'experience'
  | 'competence'
  | 'soft_skill'
  | 'value'
  | 'work_condition'
  | 'interest';

export type BilanQuestionType = 'likert_1_5' | 'open_text';

export interface BilanQuestionDocument extends Document {
  code: string; // ex: "C1", "SS4", "V7"
  domain: BilanQuestionDomain;
  subdomain?: string | null; // ex: "analysis", "RIASEC_I"
  question: string;
  type: BilanQuestionType;
  version: number; // permet de versionner le test
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BilanQuestionSchema = new Schema<BilanQuestionDocument>(
  {
    code: { type: String, required: true }, // identifiant fonctionnel
    domain: {
      type: String,
      required: true,
      enum: [
        'experience',
        'competence',
        'soft_skill',
        'value',
        'work_condition',
        'interest',
      ],
    },
    subdomain: { type: String, required: false },
    question: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['likert_1_5', 'open_text'],
    },
    version: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// index pratique pour récupérer toutes les questions d’une version
BilanQuestionSchema.index({ version: 1, domain: 1 });
BilanQuestionSchema.index({ version: 1, code: 1 }, { unique: true });

export const BilanQuestion: Model<BilanQuestionDocument> =
  model<BilanQuestionDocument>('BilanQuestion', BilanQuestionSchema);
