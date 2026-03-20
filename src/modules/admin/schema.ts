import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminUserListQuerySchema = paginationSchema.extend({
  role: z.enum(['user', 'admin']).optional(),
  subscription: z.enum(['free', 'premium']).optional(),
  isEmailVerified: z.coerce.boolean().optional(),
});

export const adminUserParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid user id'),
});

export const adminUpdateUserSchema = z
  .object({
    email: z.string().email().optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    birthYear: z.number().int().min(1900).max(2100).nullable().optional(),
    gender: z
      .enum(['male', 'female', 'other', 'undisclosed'])
      .nullable()
      .optional(),
    subscription: z.enum(['free', 'premium']).optional(),
    role: z.enum(['user', 'admin']).optional(),
    jobTypes: z.array(z.string().trim().min(1)).optional(),
    locationPref: z.enum(['remote', 'hybrid', 'on-site']).nullable().optional(),
    remote: z.boolean().nullable().optional(),
    isEmailVerified: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const adminJobListQuerySchema = paginationSchema.extend({
  sector: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const adminJobParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid job id'),
});

const growthOutlookSchema = z.enum([
  'stable',
  'growing',
  'declining',
  'unknown',
]);

const baseJobSchema = z.object({
  externalId: z.string().trim().optional(),
  source: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  riasec: z.array(z.string().trim().min(1)).optional(),
  competences: z.array(z.string().trim().min(1)).optional(),
  softSkills: z.array(z.string().trim().min(1)).optional(),
  values: z.array(z.string().trim().min(1)).optional(),
  workConditions: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  missions: z.array(z.string().trim().min(1)).optional(),
  dailyTasks: z.array(z.string().trim().min(1)).optional(),
  evolutionPaths: z.array(z.string().trim().min(1)).optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  growthOutlook: growthOutlookSchema,
});

export const adminCreateJobSchema = baseJobSchema;

export const adminUpdateJobSchema = baseJobSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const personalityOptionSchema = z.object({
  value: z.number(),
  label: z.string().trim().min(1),
});

const personalityQuestionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
  dimension: z.enum(['EI', 'SN', 'TF', 'JP']),
  options: z.array(personalityOptionSchema).min(1),
});

const personalityQuestionUpdateSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    text: z.string().trim().min(1).optional(),
    dimension: z.enum(['EI', 'SN', 'TF', 'JP']).optional(),
    options: z.array(personalityOptionSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const personalityProfileSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().optional(),
  strengths: z.array(z.string().trim().min(1)).optional(),
  weaknesses: z.array(z.string().trim().min(1)).optional(),
  recommendedJobs: z.array(z.string().trim().min(1)).optional(),
});

export const adminTemplateListQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
});

export const adminTemplateParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid template id'),
});

export const adminTemplateQuestionParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid template id'),
  questionId: z.string().trim().min(1),
});

export const adminDuplicateTemplateSchema = z.object({
  version: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().optional(),
});

const baseTemplateSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  version: z.string().trim().min(1),
  profiles: z.array(personalityProfileSchema).optional(),
  questions: z.array(personalityQuestionSchema).min(1),
});

export const adminCreateTemplateSchema = baseTemplateSchema;

export const adminUpdateTemplateSchema = baseTemplateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const adminAddTemplateQuestionSchema = personalityQuestionSchema;

export const adminUpdateTemplateQuestionSchema =
  personalityQuestionUpdateSchema;

export const adminBilanQuestionListQuerySchema = paginationSchema.extend({
  version: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  domain: z
    .enum([
      'experience',
      'competence',
      'soft_skill',
      'value',
      'work_condition',
      'interest',
    ])
    .optional(),
});

export const adminBilanQuestionParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid bilan question id'),
});

export const adminBilanVersionParamsSchema = z.object({
  version: z.coerce.number().int().positive(),
});

export const adminBilanVersionListQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const adminCreateBilanVersionSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isActive: z.boolean().optional(),
});

export const adminUpdateBilanVersionSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const adminDuplicateBilanVersionSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
});

const baseBilanQuestionSchema = z.object({
  code: z.string().trim().min(1),
  domain: z.enum([
    'experience',
    'competence',
    'soft_skill',
    'value',
    'work_condition',
    'interest',
  ]),
  subdomain: z.string().trim().nullable().optional(),
  question: z.string().trim().min(1),
  type: z.enum(['likert_1_5', 'open_text']),
  version: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const adminCreateBilanQuestionSchema = baseBilanQuestionSchema;

export const adminUpdateBilanQuestionSchema = baseBilanQuestionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });
