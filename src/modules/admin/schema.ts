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

export const adminSupportRequestListQuerySchema = paginationSchema.extend({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  category: z
    .enum(['account', 'privacy', 'billing', 'bug', 'other'])
    .optional(),
});

export const adminSupportRequestParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid support request id'),
});

export const adminUpdateSupportRequestSchema = z
  .object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    adminNotes: z.string().trim().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const adminRomeSyncRunParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid ROME sync run id'),
});

export const adminRomeSyncRunListQuerySchema = paginationSchema.omit({
  q: true,
});

export const adminInsightsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
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
      'feasibility',
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
    'feasibility',
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

const workStyleDimensionSchema = z.enum([
  'autonomy',
  'collaboration',
  'pace',
  'structure',
  'variety',
  'human_contact',
  'mobility',
  'learning',
]);

const workStyleProfileSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  strengths: z.array(z.string().trim().min(1)).default([]),
  cautions: z.array(z.string().trim().min(1)).default([]),
  advice: z.array(z.string().trim().min(1)).default([]),
  preferredAxes: z.array(workStyleDimensionSchema).default([]),
});

export const adminWorkStyleVersionListQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const adminWorkStyleVersionParamsSchema = z.object({
  version: z.coerce.number().int().positive(),
});

export const adminCreateWorkStyleVersionSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isActive: z.boolean().optional(),
  profiles: z.array(workStyleProfileSchema).optional(),
});

export const adminUpdateWorkStyleVersionSchema =
  adminCreateWorkStyleVersionSchema
    .omit({ version: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    });

export const adminDuplicateWorkStyleVersionSchema = z.object({
  version: z.number().int().positive(),
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().optional(),
});

export const adminWorkStyleQuestionListQuerySchema = paginationSchema.extend({
  version: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  dimension: workStyleDimensionSchema.optional(),
});

export const adminWorkStyleQuestionParamsSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid work style question id'),
});

const baseWorkStyleQuestionSchema = z.object({
  code: z.string().trim().min(1),
  text: z.string().trim().min(1),
  dimension: workStyleDimensionSchema,
  polarity: z.union([z.literal(1), z.literal(-1)]).optional(),
  order: z.number().int().min(0).optional(),
  version: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const adminCreateWorkStyleQuestionSchema = baseWorkStyleQuestionSchema;

export const adminUpdateWorkStyleQuestionSchema = baseWorkStyleQuestionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });
