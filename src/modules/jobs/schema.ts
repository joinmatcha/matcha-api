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

export const matchingDecisionSchema = z.object({
  jobId: z.string().regex(objectIdRegex, 'jobId invalide'),
  action: z.enum(['like', 'dislike']),
});

export const topLikedJobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

export const compareJobsSchema = z.object({
  jobIds: z
    .array(z.string().regex(objectIdRegex, 'Invalid job id'))
    .min(2, 'Compare at least 2 jobs')
    .max(3, 'Compare at most 3 jobs')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate job ids are not allowed',
      path: ['jobIds'],
    }),
});

export const jobIdParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid job id'),
});
