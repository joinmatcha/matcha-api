import { Schema, Types, model } from 'mongoose';

export type MatchingDecisionAction = 'like' | 'dislike';

export interface MatchingDecisionDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  action: MatchingDecisionAction;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchingDecisionSchema = new Schema<MatchingDecisionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'RomeMetier',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['like', 'dislike'],
      required: true,
    },
    decidedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

MatchingDecisionSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const MatchingDecision = model<MatchingDecisionDocument>(
  'MatchingDecision',
  MatchingDecisionSchema
);
