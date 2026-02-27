import { Schema, Types, model } from 'mongoose';

export interface SwipeQuotaDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dayKey: string; // YYYY-MM-DD (UTC)
  count: number;
}

const SwipeQuotaSchema = new Schema<SwipeQuotaDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayKey: {
      type: String,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: false,
  },
);

SwipeQuotaSchema.index({ userId: 1, dayKey: 1 }, { unique: true });

export const SwipeQuota = model<SwipeQuotaDocument>(
  'SwipeQuota',
  SwipeQuotaSchema,
);
