import { Document, Model, Schema, model } from 'mongoose';

export type BilanVersionStatus = 'draft' | 'active' | 'archived';

export interface BilanVersionDocument extends Document {
  version: number;
  title: string;
  description?: string;
  status: BilanVersionStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BilanVersionSchema = new Schema<BilanVersionDocument>(
  {
    version: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
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

export const BilanVersion: Model<BilanVersionDocument> =
  model<BilanVersionDocument>('BilanVersion', BilanVersionSchema);
