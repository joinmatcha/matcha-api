import { Schema, Types, model } from 'mongoose';

export type SwipeAction = 'like' | 'dislike';

export interface SwipeDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  action: SwipeAction;
  swipedAt: Date;
}

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
    swipedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

// Un user ne peut swiper un job qu'une seule fois par jour
SwipeSchema.index({ userId: 1, jobId: 1, swipedAt: 1 });

export const Swipe = model<SwipeDocument>('Swipe', SwipeSchema);
