import { Document, Model, Schema, Types, model } from 'mongoose';

export interface BilanAnswer {
  questionCode: string; // ex: "C1"
  valueNumber: number; // 1-5
}

export interface BilanAnswerSetDocument extends Document {
  user: Types.ObjectId; // ref User
  version: number;
  answers: BilanAnswer[];
  createdAt: Date;
}

const BilanAnswerSchema = new Schema<BilanAnswer>(
  {
    questionCode: { type: String, required: true },
    valueNumber: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const BilanAnswerSetSchema = new Schema<BilanAnswerSetDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, required: true, default: 1 },
    answers: { type: [BilanAnswerSchema], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// 1 seul set de réponses par user + version
BilanAnswerSetSchema.index({ user: 1, version: 1 }, { unique: true });

export const BilanAnswerSet: Model<BilanAnswerSetDocument> =
  model<BilanAnswerSetDocument>('BilanAnswerSet', BilanAnswerSetSchema);
