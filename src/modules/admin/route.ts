import { Router } from 'express';

import { requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  activateBilanVersionAdmin,
  activateTemplateAdmin,
  addTemplateQuestionAdmin,
  adminLogin,
  createBilanQuestionAdmin,
  createBilanVersionAdmin,
  createJobAdmin,
  createTemplateAdmin,
  deactivateBilanVersionAdmin,
  deactivateTemplateAdmin,
  deleteTemplateQuestionAdmin,
  duplicateBilanVersionAdmin,
  duplicateTemplateAdmin,
  listBilanQuestionsAdmin,
  listBilanVersionsAdmin,
  listJobsAdmin,
  listTemplatesAdmin,
  listUsersAdmin,
  updateBilanQuestionAdmin,
  updateBilanVersionAdmin,
  updateJobAdmin,
  updateTemplateAdmin,
  updateTemplateQuestionAdmin,
  updateUserAdmin,
} from '@/modules/admin/controller';
import {
  adminAddTemplateQuestionSchema,
  adminBilanQuestionListQuerySchema,
  adminBilanQuestionParamsSchema,
  adminBilanVersionListQuerySchema,
  adminBilanVersionParamsSchema,
  adminCreateBilanQuestionSchema,
  adminCreateBilanVersionSchema,
  adminCreateJobSchema,
  adminCreateTemplateSchema,
  adminDuplicateBilanVersionSchema,
  adminDuplicateTemplateSchema,
  adminJobListQuerySchema,
  adminJobParamsSchema,
  adminLoginSchema,
  adminTemplateListQuerySchema,
  adminTemplateParamsSchema,
  adminTemplateQuestionParamsSchema,
  adminUpdateBilanQuestionSchema,
  adminUpdateBilanVersionSchema,
  adminUpdateJobSchema,
  adminUpdateTemplateQuestionSchema,
  adminUpdateTemplateSchema,
  adminUpdateUserSchema,
  adminUserListQuerySchema,
  adminUserParamsSchema,
} from '@/modules/admin/schema';

const router = Router();

router.post('/auth/login', validate(adminLoginSchema), adminLogin);

router.use(requireAuth, requireAdmin);

router.get(
  '/users',
  validate(adminUserListQuerySchema, 'query'),
  listUsersAdmin
);
router.patch(
  '/users/:id',
  validate(adminUserParamsSchema, 'params'),
  validate(adminUpdateUserSchema),
  updateUserAdmin
);

router.get('/jobs', validate(adminJobListQuerySchema, 'query'), listJobsAdmin);
router.post('/jobs', validate(adminCreateJobSchema), createJobAdmin);
router.patch(
  '/jobs/:id',
  validate(adminJobParamsSchema, 'params'),
  validate(adminUpdateJobSchema),
  updateJobAdmin
);

router.get(
  '/personality-versions',
  validate(adminTemplateListQuerySchema, 'query'),
  listTemplatesAdmin
);
router.post(
  '/personality-versions',
  validate(adminCreateTemplateSchema),
  createTemplateAdmin
);
router.patch(
  '/personality-versions/:id',
  validate(adminTemplateParamsSchema, 'params'),
  validate(adminUpdateTemplateSchema),
  updateTemplateAdmin
);
router.post(
  '/personality-versions/:id/duplicate',
  validate(adminTemplateParamsSchema, 'params'),
  validate(adminDuplicateTemplateSchema),
  duplicateTemplateAdmin
);
router.post(
  '/personality-versions/:id/activate',
  validate(adminTemplateParamsSchema, 'params'),
  activateTemplateAdmin
);
router.post(
  '/personality-versions/:id/deactivate',
  validate(adminTemplateParamsSchema, 'params'),
  deactivateTemplateAdmin
);
router.post(
  '/personality-versions/:id/questions',
  validate(adminTemplateParamsSchema, 'params'),
  validate(adminAddTemplateQuestionSchema),
  addTemplateQuestionAdmin
);
router.patch(
  '/personality-versions/:id/questions/:questionId',
  validate(adminTemplateQuestionParamsSchema, 'params'),
  validate(adminUpdateTemplateQuestionSchema),
  updateTemplateQuestionAdmin
);
router.delete(
  '/personality-versions/:id/questions/:questionId',
  validate(adminTemplateQuestionParamsSchema, 'params'),
  deleteTemplateQuestionAdmin
);

router.get(
  '/bilan-versions',
  validate(adminBilanVersionListQuerySchema, 'query'),
  listBilanVersionsAdmin
);
router.post(
  '/bilan-versions',
  validate(adminCreateBilanVersionSchema),
  createBilanVersionAdmin
);
router.patch(
  '/bilan-versions/:version',
  validate(adminBilanVersionParamsSchema, 'params'),
  validate(adminUpdateBilanVersionSchema),
  updateBilanVersionAdmin
);
router.post(
  '/bilan-versions/:version/duplicate',
  validate(adminBilanVersionParamsSchema, 'params'),
  validate(adminDuplicateBilanVersionSchema),
  duplicateBilanVersionAdmin
);
router.post(
  '/bilan-versions/:version/activate',
  validate(adminBilanVersionParamsSchema, 'params'),
  activateBilanVersionAdmin
);
router.post(
  '/bilan-versions/:version/deactivate',
  validate(adminBilanVersionParamsSchema, 'params'),
  deactivateBilanVersionAdmin
);

router.get(
  '/bilan-questions',
  validate(adminBilanQuestionListQuerySchema, 'query'),
  listBilanQuestionsAdmin
);
router.post(
  '/bilan-questions',
  validate(adminCreateBilanQuestionSchema),
  createBilanQuestionAdmin
);
router.patch(
  '/bilan-questions/:id',
  validate(adminBilanQuestionParamsSchema, 'params'),
  validate(adminUpdateBilanQuestionSchema),
  updateBilanQuestionAdmin
);

export default router;
