import z from 'zod';

export const submitAnswersSchema = z.object({
  version: z.number(),
  answers: z.array(
    z.object({
      questionCode: z.string(),
      valueNumber: z.number().optional(),
      valueText: z.string().optional(),
    })
  ),
});

export const generateBilanSchema = z.object({
  version: z.number(),
});
