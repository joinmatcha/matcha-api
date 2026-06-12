import { Document, Model, Schema, Types, model } from 'mongoose';

export type SupportRequestCategory =
  | 'account'
  | 'privacy'
  | 'billing'
  | 'bug'
  | 'other';

export type SupportRequestStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface SupportRequestDocument extends Document {
  user: Types.ObjectId;
  email: string;
  name: string;
  category: SupportRequestCategory;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  adminNotes?: string;
  handledBy?: Types.ObjectId;
  handledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<SupportRequestDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['account', 'privacy', 'billing', 'bug', 'other'],
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    adminNotes: { type: String, trim: true },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
  },
  { timestamps: true }
);

SupportRequestSchema.index({ createdAt: -1 });
SupportRequestSchema.index({ status: 1, createdAt: -1 });
SupportRequestSchema.index({ category: 1, createdAt: -1 });
SupportRequestSchema.index({ user: 1, createdAt: -1 });

export const SupportRequest: Model<SupportRequestDocument> =
  model<SupportRequestDocument>('SupportRequest', SupportRequestSchema);
