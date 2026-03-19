import { z } from 'zod';

export const submitPersonalitySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.number(),
      })
    )
    .min(1),
});
