import { z } from 'zod';

export const submitWorkStyleSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        value: z.number().int().min(1).max(5),
      })
    )
    .min(1),
});
