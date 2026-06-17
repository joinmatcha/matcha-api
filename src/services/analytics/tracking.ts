import crypto from 'crypto';

import { env } from '@/config/env';
import {
  AnalyticsEntityType,
  AnalyticsEvent,
  AnalyticsEventType,
} from '@/models/AnalyticsEvent';

export type TrackAnalyticsEventInput = {
  eventType: AnalyticsEventType;
  sessionId: string;
  source: 'mobile';
  entityType?: AnalyticsEntityType;
  entityId?: string;
  stepId?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  appVersion?: string;
};

export const hashAnalyticsUserId = (userId: string) =>
  crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(userId)
    .digest('hex')
    .slice(0, 32);

export async function trackAnalyticsEvent(
  userId: string,
  input: TrackAnalyticsEventInput
) {
  const receivedAt = new Date();

  const event = await AnalyticsEvent.create({
    ...input,
    userHash: hashAnalyticsUserId(userId),
    metadata: input.metadata ?? {},
    occurredAt: input.occurredAt ?? receivedAt,
    receivedAt,
  });

  return {
    id: event._id.toString(),
    eventType: event.eventType,
    receivedAt: event.receivedAt.toISOString(),
  };
}
