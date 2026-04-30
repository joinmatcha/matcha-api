import { Schema, Types, model } from 'mongoose';

export type RomeSyncStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'partial_failure'
  | 'failed'
  | 'cancelled';

export type RomeSyncStep =
  | 'queued'
  | 'auth'
  | 'list_appellations'
  | 'fetch_metiers'
  | 'fetch_fiches'
  | 'write_db'
  | 'deactivate_missing'
  | 'done';

export interface RomeSyncRunDocument {
  _id: Types.ObjectId;
  type: 'manual' | 'scheduled' | 'script';
  status: RomeSyncStatus;
  currentStep: RomeSyncStep;
  currentCode?: string;
  startedBy?: Types.ObjectId;
  startedAt?: Date;
  finishedAt?: Date;
  totalAppellations: number;
  uniqueMetiers: number;
  fetchedMetiers: number;
  fetchedFiches: number;
  upsertedMetiers: number;
  updatedMetiers: number;
  deactivatedMetiers: number;
  upsertedAppellations: number;
  updatedAppellations: number;
  deactivatedAppellations: number;
  errors: Array<{
    code?: string;
    step: RomeSyncStep | 'fetch_metier' | 'fetch_fiche' | 'oauth';
    message: string;
    retryable?: boolean;
    at: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RomeSyncRunSchema = new Schema<RomeSyncRunDocument>(
  {
    type: {
      type: String,
      enum: ['manual', 'scheduled', 'script'],
      required: true,
      default: 'manual',
    },
    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'success',
        'partial_failure',
        'failed',
        'cancelled',
      ],
      required: true,
      default: 'queued',
    },
    currentStep: {
      type: String,
      enum: [
        'queued',
        'auth',
        'list_appellations',
        'fetch_metiers',
        'fetch_fiches',
        'write_db',
        'deactivate_missing',
        'done',
      ],
      required: true,
      default: 'queued',
    },
    currentCode: { type: String, trim: true },
    startedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    startedAt: Date,
    finishedAt: Date,
    totalAppellations: { type: Number, default: 0 },
    uniqueMetiers: { type: Number, default: 0 },
    fetchedMetiers: { type: Number, default: 0 },
    fetchedFiches: { type: Number, default: 0 },
    upsertedMetiers: { type: Number, default: 0 },
    updatedMetiers: { type: Number, default: 0 },
    deactivatedMetiers: { type: Number, default: 0 },
    upsertedAppellations: { type: Number, default: 0 },
    updatedAppellations: { type: Number, default: 0 },
    deactivatedAppellations: { type: Number, default: 0 },
    errors: {
      type: [
        {
          code: { type: String, trim: true },
          step: { type: String, required: true },
          message: { type: String, required: true },
          retryable: Boolean,
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

RomeSyncRunSchema.index(
  { status: 1 },
  {
    partialFilterExpression: {
      status: { $in: ['queued', 'running'] },
    },
  }
);
RomeSyncRunSchema.index({ createdAt: -1 });

export const RomeSyncRun = model<RomeSyncRunDocument>(
  'RomeSyncRun',
  RomeSyncRunSchema
);
