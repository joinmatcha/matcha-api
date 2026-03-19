import { Schema, Types, model } from 'mongoose';

export type SwipeAction = 'like' | 'dislike';

export interface SwipeDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  action: SwipeAction;
  dayKey: string;
  swipedAt: Date;
}

const computeDayKeyUTC = (date: Date) => date.toISOString().slice(0, 10);

const SwipeSchema = new Schema<SwipeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    action: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
    dayKey: {
      type: String,
      required: true,
      default: function () {
        return computeDayKeyUTC(this.swipedAt ?? new Date());
      },
      index: true,
    },
    swipedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

SwipeSchema.index({ userId: 1, jobId: 1, swipedAt: 1 });
SwipeSchema.index({ userId: 1, dayKey: 1 });
SwipeSchema.index({ userId: 1, jobId: 1, dayKey: 1 }, { unique: true });

export const Swipe = model<SwipeDocument>('Swipe', SwipeSchema);
