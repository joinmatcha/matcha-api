import { z } from 'zod';

export const analyticsEventSchema = z.object({
  eventType: z.enum([
    'test_started',
    'test_step_completed',
    'test_completed',
    'test_abandoned',
    'job_viewed',
    'job_swiped',
    'feedback_submitted',
  ]),
  sessionId: z.string().trim().min(1).max(120),
  source: z.enum(['mobile']),
  entityType: z
    .enum(['personality', 'bilan', 'work_style', 'job', 'feedback'])
    .optional(),
  entityId: z.string().trim().min(1).max(120).optional(),
  stepId: z.string().trim().min(1).max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.coerce.date().optional(),
  appVersion: z.string().trim().min(1).max(40).optional(),
});
