import { Document, Model, Schema, model } from 'mongoose';

export type AnalyticsEventType =
  | 'test_started'
  | 'test_step_completed'
  | 'test_completed'
  | 'test_abandoned'
  | 'job_matched'
  | 'job_viewed'
  | 'job_swiped'
  | 'feedback_submitted';

export type AnalyticsSource = 'mobile';

export type AnalyticsEntityType =
  | 'personality'
  | 'bilan'
  | 'work_style'
  | 'job'
  | 'feedback';

export interface AnalyticsEventDocument extends Document {
  eventType: AnalyticsEventType;
  userHash: string;
  sessionId: string;
  source: AnalyticsSource;
  entityType?: AnalyticsEntityType;
  entityId?: string;
  stepId?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  receivedAt: Date;
  appVersion?: string;
}

const AnalyticsEventSchema = new Schema<AnalyticsEventDocument>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'test_started',
        'test_step_completed',
        'test_completed',
        'test_abandoned',
        'job_matched',
        'job_viewed',
        'job_swiped',
        'feedback_submitted',
      ],
      index: true,
    },
    userHash: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, trim: true, index: true },
    source: { type: String, required: true, enum: ['mobile'], index: true },
    entityType: {
      type: String,
      enum: ['personality', 'bilan', 'work_style', 'job', 'feedback'],
      index: true,
    },
    entityId: { type: String, trim: true, index: true },
    stepId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, required: true, index: true },
    receivedAt: { type: Date, required: true, default: Date.now, index: true },
    appVersion: { type: String, trim: true },
  },
  {
    collection: 'analytics_events',
    timestamps: false,
  }
);

AnalyticsEventSchema.index({ eventType: 1, receivedAt: -1 });
AnalyticsEventSchema.index({ entityType: 1, entityId: 1, receivedAt: -1 });
AnalyticsEventSchema.index({ userHash: 1, receivedAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, receivedAt: -1 });

export const AnalyticsEvent: Model<AnalyticsEventDocument> =
  model<AnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
