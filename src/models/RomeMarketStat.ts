import { Schema, Types, model } from 'mongoose';

export interface MarketIndicatorValue {
  code?: string;
  label?: string;
  periodCode?: string;
  periodLabel?: string;
  name?: string;
  count?: number;
  amount?: number;
  rate?: number;
  decimal?: number;
  rank?: number;
  percentage?: number;
  secondaryCount?: number;
  secondaryPercentage?: number;
  secondaryRate?: number;
}

export interface MarketIndicatorSnapshot {
  code?: string;
  family?: string;
  label?: string;
  updatedAt?: Date;
  periodCode?: string;
  periodLabel?: string;
  mainName?: string;
  values: MarketIndicatorValue[];
}

export interface RomeMarketStatDocument {
  _id: Types.ObjectId;
  metierId: Types.ObjectId;
  metierCode: string;
  metierLabel: string;
  territory: {
    type: string;
    code: string;
    label?: string;
  };
  salary?: MarketIndicatorSnapshot;
  offers?: MarketIndicatorSnapshot;
  hires?: MarketIndicatorSnapshot;
  demanders?: MarketIndicatorSnapshot;
  tension?: MarketIndicatorSnapshot;
  lastSyncedAt: Date;
  raw?: {
    salary?: unknown;
    offers?: unknown;
    hires?: unknown;
    demanders?: unknown;
    tension?: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MarketIndicatorValueSchema = new Schema<MarketIndicatorValue>(
  {
    code: { type: String, trim: true },
    label: { type: String, trim: true },
    periodCode: { type: String, trim: true },
    periodLabel: { type: String, trim: true },
    name: { type: String, trim: true },
    count: Number,
    amount: Number,
    rate: Number,
    decimal: Number,
    rank: Number,
    percentage: Number,
    secondaryCount: Number,
    secondaryPercentage: Number,
    secondaryRate: Number,
  },
  { _id: false }
);

const MarketIndicatorSnapshotSchema = new Schema<MarketIndicatorSnapshot>(
  {
    code: { type: String, trim: true },
    family: { type: String, trim: true },
    label: { type: String, trim: true },
    updatedAt: Date,
    periodCode: { type: String, trim: true },
    periodLabel: { type: String, trim: true },
    mainName: { type: String, trim: true },
    values: { type: [MarketIndicatorValueSchema], default: [] },
  },
  { _id: false }
);

const RomeMarketStatSchema = new Schema<RomeMarketStatDocument>(
  {
    metierId: {
      type: Schema.Types.ObjectId,
      ref: 'RomeMetier',
      required: true,
      index: true,
    },
    metierCode: { type: String, required: true, trim: true, index: true },
    metierLabel: { type: String, required: true, trim: true },
    territory: {
      type: { type: String, required: true, trim: true },
      code: { type: String, required: true, trim: true },
      label: { type: String, trim: true },
    },
    salary: MarketIndicatorSnapshotSchema,
    offers: MarketIndicatorSnapshotSchema,
    hires: MarketIndicatorSnapshotSchema,
    demanders: MarketIndicatorSnapshotSchema,
    tension: MarketIndicatorSnapshotSchema,
    lastSyncedAt: { type: Date, required: true, index: true },
    raw: {
      salary: Schema.Types.Mixed,
      offers: Schema.Types.Mixed,
      hires: Schema.Types.Mixed,
      demanders: Schema.Types.Mixed,
      tension: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

RomeMarketStatSchema.index(
  { metierCode: 1, 'territory.type': 1, 'territory.code': 1 },
  { unique: true }
);
RomeMarketStatSchema.index({ 'territory.type': 1, 'territory.code': 1 });

export const RomeMarketStat = model<RomeMarketStatDocument>(
  'RomeMarketStat',
  RomeMarketStatSchema
);
