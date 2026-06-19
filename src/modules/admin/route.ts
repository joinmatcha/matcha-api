import { Router } from 'express';

import { requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  activateBilanVersionAdmin,
  activateTemplateAdmin,
  activateWorkStyleVersionAdmin,
  addTemplateQuestionAdmin,
  adminLogin,
  adminLogout,
  createBilanQuestionAdmin,
  createBilanVersionAdmin,
  createTemplateAdmin,
  createWorkStyleQuestionAdmin,
  createWorkStyleVersionAdmin,
  deactivateBilanVersionAdmin,
  deactivateTemplateAdmin,
  deactivateWorkStyleVersionAdmin,
  deleteTemplateQuestionAdmin,
  duplicateBilanVersionAdmin,
  duplicateTemplateAdmin,
  duplicateWorkStyleVersionAdmin,
  getStatsAdmin,
  getUserAdmin,
  listBilanQuestionsAdmin,
  listBilanVersionsAdmin,
  listSupportRequestsAdmin,
  listTemplatesAdmin,
  listUsersAdmin,
  listWorkStyleQuestionsAdmin,
  listWorkStyleVersionsAdmin,
  updateBilanQuestionAdmin,
  updateBilanVersionAdmin,
  updateSupportRequestAdmin,
  updateTemplateAdmin,
  updateTemplateQuestionAdmin,
  updateUserAdmin,
  updateWorkStyleQuestionAdmin,
  updateWorkStyleVersionAdmin,
} from '@/modules/admin/controller';
import {
  getInsightsActivityAdmin,
  getInsightsJobsAdmin,
  getInsightsOrientationAdmin,
  getInsightsOverviewAdmin,
  getInsightsTestsAdmin,
} from '@/modules/admin/insights.controller';
import {
  getRomeStatusAdmin,
  getRomeSyncRunAdmin,
  listRomeSyncRunsAdmin,
  startRomeSyncAdmin,
} from '@/modules/admin/rome.controller';
import {
  adminAddTemplateQuestionSchema,
  adminBilanQuestionListQuerySchema,
  adminBilanQuestionParamsSchema,
  adminBilanVersionListQuerySchema,
  adminBilanVersionParamsSchema,
  adminCreateBilanQuestionSchema,
  adminCreateBilanVersionSchema,
  adminCreateTemplateSchema,
  adminCreateWorkStyleQuestionSchema,
  adminCreateWorkStyleVersionSchema,
  adminDuplicateBilanVersionSchema,
  adminDuplicateTemplateSchema,
  adminDuplicateWorkStyleVersionSchema,
  adminInsightsQuerySchema,
  adminLoginSchema,
  adminRomeSyncRunListQuerySchema,
  adminRomeSyncRunParamsSchema,
  adminSupportRequestListQuerySchema,
  adminSupportRequestParamsSchema,
  adminTemplateListQuerySchema,
  adminTemplateParamsSchema,
  adminTemplateQuestionParamsSchema,
  adminUpdateBilanQuestionSchema,
  adminUpdateBilanVersionSchema,
  adminUpdateSupportRequestSchema,
  adminUpdateTemplateQuestionSchema,
  adminUpdateTemplateSchema,
  adminUpdateUserSchema,
  adminUpdateWorkStyleQuestionSchema,
  adminUpdateWorkStyleVersionSchema,
  adminUserListQuerySchema,
  adminUserParamsSchema,
  adminWorkStyleQuestionListQuerySchema,
  adminWorkStyleQuestionParamsSchema,
  adminWorkStyleVersionListQuerySchema,
  adminWorkStyleVersionParamsSchema,
} from '@/modules/admin/schema';

const router = Router();

router.post('/auth/login', validate(adminLoginSchema), adminLogin);
router.post('/auth/logout', adminLogout);

router.use(requireAuth, requireAdmin);

router.get(
  '/users',
  validate(adminUserListQuerySchema, 'query'),
  listUsersAdmin
);
router.get(
  '/users/:id',
  validate(adminUserParamsSchema, 'params'),
  getUserAdmin
);
router.patch(
  '/users/:id',
  validate(adminUserParamsSchema, 'params'),
  validate(adminUpdateUserSchema),
  updateUserAdmin
);

router.get('/stats', getStatsAdmin);

router.get(
  '/insights/overview',
  validate(adminInsightsQuerySchema, 'query'),
  getInsightsOverviewAdmin
);
router.get(
  '/insights/activity',
  validate(adminInsightsQuerySchema, 'query'),
  getInsightsActivityAdmin
);
router.get(
  '/insights/tests',
  validate(adminInsightsQuerySchema, 'query'),
  getInsightsTestsAdmin
);
router.get(
  '/insights/jobs',
  validate(adminInsightsQuerySchema, 'query'),
  getInsightsJobsAdmin
);
router.get(
  '/insights/orientation',
  validate(adminInsightsQuerySchema, 'query'),
  getInsightsOrientationAdmin
);

router.get(
  '/support-requests',
  validate(adminSupportRequestListQuerySchema, 'query'),
  listSupportRequestsAdmin
);
router.patch(
  '/support-requests/:id',
  validate(adminSupportRequestParamsSchema, 'params'),
  validate(adminUpdateSupportRequestSchema),
  updateSupportRequestAdmin
);

router.get('/rome/status', getRomeStatusAdmin);
router.post('/rome/sync', startRomeSyncAdmin);
router.get(
  '/rome/sync-runs',
  validate(adminRomeSyncRunListQuerySchema, 'query'),
  listRomeSyncRunsAdmin
);
router.get(
  '/rome/sync-runs/:id',
  validate(adminRomeSyncRunParamsSchema, 'params'),
  getRomeSyncRunAdmin
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

router.get(
  '/work-style-versions',
  validate(adminWorkStyleVersionListQuerySchema, 'query'),
  listWorkStyleVersionsAdmin
);
router.post(
  '/work-style-versions',
  validate(adminCreateWorkStyleVersionSchema),
  createWorkStyleVersionAdmin
);
router.patch(
  '/work-style-versions/:version',
  validate(adminWorkStyleVersionParamsSchema, 'params'),
  validate(adminUpdateWorkStyleVersionSchema),
  updateWorkStyleVersionAdmin
);
router.post(
  '/work-style-versions/:version/duplicate',
  validate(adminWorkStyleVersionParamsSchema, 'params'),
  validate(adminDuplicateWorkStyleVersionSchema),
  duplicateWorkStyleVersionAdmin
);
router.post(
  '/work-style-versions/:version/activate',
  validate(adminWorkStyleVersionParamsSchema, 'params'),
  activateWorkStyleVersionAdmin
);
router.post(
  '/work-style-versions/:version/deactivate',
  validate(adminWorkStyleVersionParamsSchema, 'params'),
  deactivateWorkStyleVersionAdmin
);

router.get(
  '/work-style-questions',
  validate(adminWorkStyleQuestionListQuerySchema, 'query'),
  listWorkStyleQuestionsAdmin
);
router.post(
  '/work-style-questions',
  validate(adminCreateWorkStyleQuestionSchema),
  createWorkStyleQuestionAdmin
);
router.patch(
  '/work-style-questions/:id',
  validate(adminWorkStyleQuestionParamsSchema, 'params'),
  validate(adminUpdateWorkStyleQuestionSchema),
  updateWorkStyleQuestionAdmin
);

export default router;
