import { Schema, Types, model } from 'mongoose';

export interface RomeAppellationDocument {
  _id: Types.ObjectId;
  code: string;
  label: string;
  shortLabel?: string;
  normalizedLabel: string;
  metierCode: string;
  metierLabel: string;
  metierId?: Types.ObjectId;
  classification?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  removedFromRomeAt?: Date;
  raw?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const RomeAppellationSchema = new Schema<RomeAppellationDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true, index: true },
    shortLabel: { type: String, trim: true },
    normalizedLabel: { type: String, required: true, trim: true, index: true },
    metierCode: { type: String, required: true, trim: true, index: true },
    metierLabel: { type: String, required: true, trim: true, index: true },
    metierId: { type: Schema.Types.ObjectId, ref: 'RomeMetier', index: true },
    classification: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    lastSyncedAt: Date,
    removedFromRomeAt: Date,
    raw: Schema.Types.Mixed,
  },
  { timestamps: true }
);

RomeAppellationSchema.index({
  label: 'text',
  shortLabel: 'text',
  normalizedLabel: 'text',
  metierLabel: 'text',
});
RomeAppellationSchema.index({ isActive: 1, metierCode: 1 });

export const RomeAppellation = model<RomeAppellationDocument>(
  'RomeAppellation',
  RomeAppellationSchema
);
