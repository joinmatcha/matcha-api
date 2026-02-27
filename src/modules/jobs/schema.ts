import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const listJobsQuerySchema = z.object({
  q: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  riasec: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const swipeJobSchema = z.object({
  jobId: z.string().regex(objectIdRegex, 'jobId invalide'),
  action: z.enum(['like', 'dislike']),
});

export const jobIdParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid job id'),
});
