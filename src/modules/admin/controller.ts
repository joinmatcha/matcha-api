import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import { env } from '@/config/env';
import { BilanCompetence } from '@/models/BilanCompetence';
import { BilanQuestion } from '@/models/BilanQuestion';
import { BilanVersion } from '@/models/BilanVersion';
import { PersonalityProfile } from '@/models/PersonalityProfile';
import { PersonalityQuestion } from '@/models/PersonalityQuestion';
import PersonalityTest from '@/models/PersonalityTest';
import { PersonalityVersion } from '@/models/PersonalityVersion';
import { RomeAppellation } from '@/models/RomeAppellation';
import { RomeMetier } from '@/models/RomeMetier';
import { RomeSyncRun } from '@/models/RomeSyncRun';
import { SupportRequest } from '@/models/SupportRequest';
import { Swipe } from '@/models/Swipe';
import User from '@/models/User';
import { WorkStyleQuestion } from '@/models/WorkStyleQuestion';
import { WorkStyleVersion } from '@/models/WorkStyleVersion';

type PaginationQuery = {
  page?: number;
  limit?: number;
  q?: string;
};

type IdParams = { id: string };
type TemplateQuestionParams = { id: string; questionId: string };
type TemplateQuestionPayload = {
  id: string;
  text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  options: { value: number; label: string }[];
};

const USER_ADMIN_FIELDS =
  '_id email firstName lastName birthYear gender subscription role jobTypes locationPref remote isEmailVerified consentAccepted createdAt updatedAt';

const buildPagination = (query: PaginationQuery) => {
  const page = Number.isFinite(query.page) ? Math.max(query.page ?? 1, 1) : 1;
  const limit = Number.isFinite(query.limit)
    ? Math.min(Math.max(query.limit ?? 20, 1), 100)
    : 20;

  return { page, limit, skip: (page - 1) * limit };
};

const isDuplicateKeyError = (error: unknown): error is { code: number } =>
  !!error &&
  typeof error === 'object' &&
  'code' in error &&
  (error as { code?: number }).code === 11000;

const ensureSingleActiveTemplate = async (
  versionId: string,
  version: string
): Promise<void> => {
  await PersonalityVersion.updateMany(
    { _id: { $ne: versionId }, isActive: true },
    { $set: { isActive: false } }
  );
  await PersonalityQuestion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false } }
  );
  await PersonalityProfile.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false } }
  );
};

const getTemplateById = async (templateId: string) => {
  const template = await PersonalityVersion.findById(templateId);
  return template ?? null;
};

const hasQuestionIdConflict = (
  questionCodes: string[],
  nextQuestionId: string,
  currentQuestionId?: string
) =>
  questionCodes.some(
    (questionCode) =>
      questionCode === nextQuestionId &&
      (!currentQuestionId || questionCode !== currentQuestionId)
  );

const getTemplateQuestions = async (versionId: string) =>
  PersonalityQuestion.find({ versionId }).sort({ order: 1, createdAt: 1 });

const getTemplateProfiles = async (versionId: string) =>
  PersonalityProfile.find({ versionId }).sort({ key: 1 });

const serializePersonalityVersion = async (versionDoc: {
  _id: Types.ObjectId | string;
  version: string;
  title: string;
  summary?: string;
  isActive: boolean;
  status?: string;
}) => {
  const versionId = versionDoc._id.toString();
  const [questions, profiles] = await Promise.all([
    getTemplateQuestions(versionId),
    getTemplateProfiles(versionId),
  ]);

  return {
    _id: versionId,
    version: versionDoc.version,
    title: versionDoc.title,
    summary: versionDoc.summary,
    isActive: versionDoc.isActive,
    status: versionDoc.status,
    questions: questions.map((question) => ({
      id: question.code,
      text: question.text,
      dimension: question.dimension,
      options: question.options,
      order: question.order,
      isActive: question.isActive,
    })),
    profiles: profiles.map((profile) => ({
      key: profile.key,
      label: profile.label,
      description: profile.description,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      recommendedJobs: profile.recommendedJobs,
      isActive: profile.isActive,
    })),
  };
};

const ensureSingleActiveBilanVersion = async (
  version: number
): Promise<void> => {
  await BilanVersion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false, status: 'archived' } }
  );
};

const getBilanVersionByNumber = async (version: number) => {
  const bilanVersion = await BilanVersion.findOne({ version });
  return bilanVersion ?? null;
};

const ensureSingleActiveWorkStyleVersion = async (
  version: number
): Promise<void> => {
  await WorkStyleVersion.updateMany(
    { version: { $ne: version }, isActive: true },
    { $set: { isActive: false, status: 'archived' } }
  );
};

const getWorkStyleVersionByNumber = async (version: number) => {
  const workStyleVersion = await WorkStyleVersion.findOne({ version });
  return workStyleVersion ?? null;
};

export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        message: 'Please verify your email address before logging in.',
      });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie(env.ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogout = (_req: Request, res: Response): void => {
  res.clearCookie(env.ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out' });
};

export const listUsersAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      role?: 'user' | 'admin';
      subscription?: 'free' | 'premium';
      isEmailVerified?: boolean;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
      ];
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.subscription) {
      filter.subscription = query.subscription;
    }

    if (typeof query.isEmailVerified === 'boolean') {
      filter.isEmailVerified = query.isEmailVerified;
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select(USER_ADMIN_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStatsAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      adminUsers,
      premiumUsers,
      verifiedUsers,
      personalityTests,
      bilanResults,
      totalSwipes,
      likedSwipes,
      activeRomeMetiers,
      activeRomeAppellations,
      personalityVersions,
      bilanVersions,
      lastRomeRun,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ subscription: 'premium' }),
      User.countDocuments({ isEmailVerified: true }),
      PersonalityTest.countDocuments(),
      BilanCompetence.countDocuments(),
      Swipe.countDocuments(),
      Swipe.countDocuments({ action: 'like' }),
      RomeMetier.countDocuments({ isActive: true }),
      RomeAppellation.countDocuments({ isActive: true }),
      PersonalityVersion.countDocuments(),
      BilanVersion.countDocuments(),
      RomeSyncRun.findOne().sort({ createdAt: -1 }).lean(),
    ]);

    res.status(200).json({
      users: {
        total: totalUsers,
        admins: adminUsers,
        premium: premiumUsers,
        verified: verifiedUsers,
        verificationRate:
          totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      },
      engagement: {
        personalityTests,
        bilanResults,
        totalSwipes,
        likedSwipes,
      },
      content: {
        personalityVersions,
        bilanVersions,
        activeRomeMetiers,
        activeRomeAppellations,
      },
      rome: {
        lastRun: lastRomeRun
          ? {
              id: lastRomeRun._id.toString(),
              status: lastRomeRun.status,
              createdAt: lastRomeRun.createdAt,
              finishedAt: lastRomeRun.finishedAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [user, personalityTests, bilans, swipeStats] = await Promise.all([
      User.findById(req.params.id).select(USER_ADMIN_FIELDS).lean(),
      PersonalityTest.find({ userId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      BilanCompetence.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Swipe.aggregate([
        { $match: { userId: new Types.ObjectId(req.params.id) } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const swipes = swipeStats.reduce(
      (acc, item) => ({
        ...acc,
        [item._id]: item.count,
      }),
      { like: 0, dislike: 0 }
    );

    res.status(200).json({
      user,
      personalityTests: personalityTests.map((test) => ({
        id: test._id.toString(),
        templateVersion: test.templateVersion,
        type: test.type,
        result: test.result,
        description: test.description,
        traits: test.traits,
        weaknesses: test.weaknesses,
        motivationProfile: test.motivationProfile,
        createdAt: test.createdAt,
      })),
      bilans: bilans.map((bilan) => ({
        id: bilan._id.toString(),
        version: bilan.version,
        createdAt: bilan.createdAt,
        archetype: bilan.conclusion?.archetype,
        profileSummary: bilan.conclusion?.profileSummary,
        keyStrengths: bilan.conclusion?.keyStrengths ?? [],
        recommendedJobs: bilan.conclusion?.recommendedJobs ?? [],
      })),
      swipes: {
        likes: swipes.like ?? 0,
        dislikes: swipes.dislike ?? 0,
        total: (swipes.like ?? 0) + (swipes.dislike ?? 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const update = req.body as Record<string, unknown>;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select(USER_ADMIN_FIELDS);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }
    next(error);
  }
};

export const listSupportRequestsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      category?: 'account' | 'privacy' | 'billing' | 'bug' | 'other';
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const [items, total] = await Promise.all([
      SupportRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportRequestAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const update = req.body as {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      adminNotes?: string;
    };
    const set: Record<string, unknown> = { ...update };
    const unset: Record<string, ''> = {};

    if (update.status && update.status !== 'open') {
      set.handledBy = req.user?.id;
      set.handledAt = new Date();
    }

    if (update.status === 'open') {
      unset.handledBy = '';
      unset.handledAt = '';
    }

    const updateOperation: Record<string, unknown> = { $set: set };
    if (Object.keys(unset).length > 0) {
      updateOperation.$unset = unset;
    }

    const supportRequest = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      { new: true, runValidators: true }
    );

    if (!supportRequest) {
      res.status(404).json({ message: 'Support request not found' });
      return;
    }

    res.status(200).json(supportRequest);
  } catch (error) {
    next(error);
  }
};

export const listTemplatesAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      isActive?: boolean;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { version: { $regex: q, $options: 'i' } },
      ];
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    const [versions, total] = await Promise.all([
      PersonalityVersion.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PersonalityVersion.countDocuments(filter),
    ]);

    const items = await Promise.all(
      versions.map((version) => serializePersonalityVersion(version))
    );

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      summary,
      version,
      isActive,
      questions = [],
      profiles = [],
    } = req.body as {
      title: string;
      summary?: string;
      version: string;
      isActive?: boolean;
      questions?: TemplateQuestionPayload[];
      profiles?: Array<{
        key: string;
        label: string;
        description?: string;
        strengths?: string[];
        weaknesses?: string[];
        recommendedJobs?: string[];
      }>;
    };

    const versionDoc = await PersonalityVersion.create({
      title,
      summary,
      version,
      isActive: isActive ?? false,
      status: isActive ? 'active' : 'draft',
    });

    if (questions.length > 0) {
      await PersonalityQuestion.insertMany(
        questions.map((question, index) => ({
          versionId: versionDoc._id,
          version: versionDoc.version,
          code: question.id,
          text: question.text,
          dimension: question.dimension,
          options: question.options,
          order: index + 1,
          isActive: true,
        }))
      );
    }

    if (profiles.length > 0) {
      await PersonalityProfile.insertMany(
        profiles.map((profile) => ({
          ...profile,
          versionId: versionDoc._id,
          version: versionDoc.version,
          isActive: true,
        }))
      );
    }

    if (versionDoc.isActive) {
      await ensureSingleActiveTemplate(
        versionDoc._id.toString(),
        versionDoc.version
      );
    }

    const payload = await serializePersonalityVersion(versionDoc);
    res.status(201).json(payload);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: 'A personality version with this version already exists',
      });
      return;
    }
    next(error);
  }
};

export const updateTemplateAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await PersonalityVersion.findById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const { title, summary, isActive } = req.body as {
      title?: string;
      summary?: string;
      isActive?: boolean;
    };

    if (typeof title === 'string') template.title = title;
    if (typeof summary === 'string' || typeof summary === 'undefined') {
      template.summary = summary;
    }
    if (typeof isActive === 'boolean') {
      template.isActive = isActive;
      template.status = isActive ? 'active' : 'archived';
    }

    await template.save();

    if (template.isActive) {
      await ensureSingleActiveTemplate(
        template._id.toString(),
        template.version
      );
    }

    res.status(200).json(await serializePersonalityVersion(template));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: 'A personality version with this version already exists',
      });
      return;
    }
    next(error);
  }
};

export const duplicateTemplateAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const source = await getTemplateById(req.params.id);

    if (!source) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const { version, title, summary } = req.body as {
      version: string;
      title?: string;
      summary?: string;
    };

    const existingVersion = await PersonalityVersion.findOne({ version })
      .select('_id')
      .lean();
    if (existingVersion) {
      res.status(409).json({
        message: 'A personality version with this version already exists',
      });
      return;
    }

    const clone = await PersonalityVersion.create({
      title: title ?? source.title,
      summary: summary ?? source.summary,
      version,
      isActive: false,
      status: 'draft',
    });

    const [sourceQuestions, sourceProfiles] = await Promise.all([
      getTemplateQuestions(source._id.toString()),
      getTemplateProfiles(source._id.toString()),
    ]);

    if (sourceQuestions.length > 0) {
      await PersonalityQuestion.insertMany(
        sourceQuestions.map((question) => ({
          versionId: clone._id,
          version: clone.version,
          code: question.code,
          text: question.text,
          dimension: question.dimension,
          options: question.options,
          order: question.order,
          isActive: question.isActive,
        }))
      );
    }

    if (sourceProfiles.length > 0) {
      await PersonalityProfile.insertMany(
        sourceProfiles.map((profile) => ({
          versionId: clone._id,
          version: clone.version,
          key: profile.key,
          label: profile.label,
          description: profile.description,
          strengths: profile.strengths,
          weaknesses: profile.weaknesses,
          recommendedJobs: profile.recommendedJobs,
          isActive: profile.isActive,
        }))
      );
    }

    res.status(201).json(await serializePersonalityVersion(clone));
  } catch (error) {
    next(error);
  }
};

export const activateTemplateAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const questions = await getTemplateQuestions(template._id.toString());
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        message: 'Cannot activate a personality version without questions',
      });
      return;
    }

    template.isActive = true;
    template.status = 'active';
    await template.save();
    await PersonalityQuestion.updateMany(
      { versionId: template._id },
      { $set: { isActive: true } }
    );
    await PersonalityProfile.updateMany(
      { versionId: template._id },
      { $set: { isActive: true } }
    );
    await ensureSingleActiveTemplate(template._id.toString(), template.version);

    res.status(200).json(await serializePersonalityVersion(template));
  } catch (error) {
    next(error);
  }
};

export const deactivateTemplateAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    template.isActive = false;
    template.status = 'archived';
    await template.save();

    res.status(200).json(await serializePersonalityVersion(template));
  } catch (error) {
    next(error);
  }
};

export const addTemplateQuestionAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const nextQuestion = req.body as TemplateQuestionPayload;
    const questions = await getTemplateQuestions(template._id.toString());
    const questionCodes = questions.map((question) => question.code);

    if (hasQuestionIdConflict(questionCodes, nextQuestion.id)) {
      res.status(409).json({
        message: 'A question with this id already exists in this template',
      });
      return;
    }

    await PersonalityQuestion.create({
      versionId: template._id,
      version: template.version,
      code: nextQuestion.id,
      text: nextQuestion.text,
      dimension: nextQuestion.dimension,
      options: nextQuestion.options,
      order: questions.length + 1,
      isActive: template.isActive,
    });

    res.status(201).json(await serializePersonalityVersion(template));
  } catch (error) {
    next(error);
  }
};

export const updateTemplateQuestionAdmin = async (
  req: Request<TemplateQuestionParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const questionDoc = await PersonalityQuestion.findOne({
      versionId: template._id,
      code: req.params.questionId,
    });

    if (!questionDoc) {
      res.status(404).json({ message: 'Personality question not found' });
      return;
    }

    const questions = await getTemplateQuestions(template._id.toString());
    const questionCodes = questions.map((question) => question.code);
    const currentQuestionData = {
      id: questionDoc.code,
      text: questionDoc.text,
      dimension: questionDoc.dimension,
      options: questionDoc.options,
    };
    const nextQuestion = {
      ...currentQuestionData,
      ...(req.body as Partial<TemplateQuestionPayload>),
    };

    if (
      nextQuestion.id !== questionDoc.code &&
      hasQuestionIdConflict(questionCodes, nextQuestion.id, questionDoc.code)
    ) {
      res.status(409).json({
        message: 'A question with this id already exists in this template',
      });
      return;
    }

    questionDoc.code = nextQuestion.id;
    questionDoc.text = nextQuestion.text;
    questionDoc.dimension = nextQuestion.dimension;
    questionDoc.options = nextQuestion.options;
    await questionDoc.save();

    res.status(200).json(await serializePersonalityVersion(template));
  } catch (error) {
    next(error);
  }
};

export const deleteTemplateQuestionAdmin = async (
  req: Request<TemplateQuestionParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      res.status(404).json({ message: 'Personality version not found' });
      return;
    }

    const deletedQuestion = await PersonalityQuestion.findOneAndDelete({
      versionId: template._id,
      code: req.params.questionId,
    });

    if (!deletedQuestion) {
      res.status(404).json({ message: 'Personality question not found' });
      return;
    }

    res.status(200).json(await serializePersonalityVersion(template));
  } catch (error) {
    next(error);
  }
};

export const listBilanQuestionsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      version?: number;
      isActive?: boolean;
      domain?: string;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { question: { $regex: q, $options: 'i' } },
        { subdomain: { $regex: q, $options: 'i' } },
      ];
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (typeof query.version === 'number') {
      filter.version = query.version;
    }

    if (query.domain) {
      filter.domain = query.domain;
    }

    const [items, total] = await Promise.all([
      BilanQuestion.find(filter)
        .sort({ version: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BilanQuestion.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listBilanVersionsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      status?: 'draft' | 'active' | 'archived';
      isActive?: boolean;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      BilanVersion.find(filter)
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BilanVersion.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBilanVersionAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bilanVersion = await BilanVersion.create({
      ...req.body,
      isActive: req.body.isActive ?? false,
      status:
        req.body.status ??
        ((req.body.isActive as boolean | undefined) ? 'active' : 'draft'),
    });

    if (bilanVersion.isActive) {
      await ensureSingleActiveBilanVersion(bilanVersion.version);
    }

    res.status(201).json(bilanVersion);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res
        .status(409)
        .json({ message: 'A bilan version with this version already exists' });
      return;
    }
    next(error);
  }
};

export const updateBilanVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const bilanVersion = await getBilanVersionByNumber(versionNumber);

    if (!bilanVersion) {
      res.status(404).json({ message: 'Bilan version not found' });
      return;
    }

    bilanVersion.set(req.body);

    if (bilanVersion.isActive) {
      bilanVersion.status = 'active';
    } else if (bilanVersion.status === 'active') {
      bilanVersion.status = 'archived';
    }

    await bilanVersion.save();

    if (bilanVersion.isActive) {
      await ensureSingleActiveBilanVersion(bilanVersion.version);
    }

    res.status(200).json(bilanVersion);
  } catch (error) {
    next(error);
  }
};

export const duplicateBilanVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sourceVersion = Number(req.params.version);
    const source = await getBilanVersionByNumber(sourceVersion);

    if (!source) {
      res.status(404).json({ message: 'Bilan version not found' });
      return;
    }

    const { version, title, description } = req.body as {
      version: number;
      title?: string;
      description?: string;
    };

    const existing = await getBilanVersionByNumber(version);
    if (existing) {
      res
        .status(409)
        .json({ message: 'A bilan version with this version already exists' });
      return;
    }

    const sourceQuestions = await BilanQuestion.find({
      version: sourceVersion,
    }).lean();

    const clone = await BilanVersion.create({
      version,
      title: title ?? source.title,
      description: description ?? source.description,
      isActive: false,
      status: 'draft',
    });

    if (sourceQuestions.length > 0) {
      await BilanQuestion.insertMany(
        sourceQuestions.map((question) => ({
          code: question.code,
          domain: question.domain,
          subdomain: question.subdomain,
          question: question.question,
          type: question.type,
          isActive: question.isActive,
          version,
        }))
      );
    }

    res.status(201).json(clone);
  } catch (error) {
    next(error);
  }
};

export const activateBilanVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const bilanVersion = await getBilanVersionByNumber(versionNumber);

    if (!bilanVersion) {
      res.status(404).json({ message: 'Bilan version not found' });
      return;
    }

    const activeQuestionsCount = await BilanQuestion.countDocuments({
      version: versionNumber,
      isActive: true,
    });

    if (activeQuestionsCount === 0) {
      res.status(400).json({
        message: 'Cannot activate a bilan version without active questions',
      });
      return;
    }

    bilanVersion.isActive = true;
    bilanVersion.status = 'active';
    await bilanVersion.save();
    await ensureSingleActiveBilanVersion(versionNumber);

    res.status(200).json(bilanVersion);
  } catch (error) {
    next(error);
  }
};

export const deactivateBilanVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const bilanVersion = await getBilanVersionByNumber(versionNumber);

    if (!bilanVersion) {
      res.status(404).json({ message: 'Bilan version not found' });
      return;
    }

    bilanVersion.isActive = false;
    bilanVersion.status = 'archived';
    await bilanVersion.save();

    res.status(200).json(bilanVersion);
  } catch (error) {
    next(error);
  }
};

export const createBilanQuestionAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const existingVersion = await getBilanVersionByNumber(
      req.body.version as number
    );
    if (!existingVersion) {
      res.status(400).json({ message: 'Bilan version does not exist' });
      return;
    }

    const question = await BilanQuestion.create(req.body);
    res.status(201).json(question);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res
        .status(409)
        .json({ message: 'A question with this code already exists' });
      return;
    }
    next(error);
  }
};

export const updateBilanQuestionAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid bilan question id' });
      return;
    }

    if (typeof req.body.version === 'number') {
      const existingVersion = await getBilanVersionByNumber(req.body.version);
      if (!existingVersion) {
        res.status(400).json({ message: 'Bilan version does not exist' });
        return;
      }
    }

    const question = await BilanQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!question) {
      res.status(404).json({ message: 'Bilan question not found' });
      return;
    }

    res.status(200).json(question);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res
        .status(409)
        .json({ message: 'A question with this code already exists' });
      return;
    }
    next(error);
  }
};

export const listWorkStyleVersionsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      status?: 'draft' | 'active' | 'archived';
      isActive?: boolean;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
      ];
    }
    if (query.status) filter.status = query.status;
    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;

    const [items, total] = await Promise.all([
      WorkStyleVersion.find(filter)
        .sort({ version: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkStyleVersion.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkStyleVersionAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workStyleVersion = await WorkStyleVersion.create({
      ...req.body,
      isActive: req.body.isActive ?? false,
      status:
        req.body.status ??
        ((req.body.isActive as boolean | undefined) ? 'active' : 'draft'),
      profiles: req.body.profiles ?? [],
    });

    if (workStyleVersion.isActive) {
      await ensureSingleActiveWorkStyleVersion(workStyleVersion.version);
    }

    res.status(201).json(workStyleVersion);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: 'A work style version with this version already exists',
      });
      return;
    }
    next(error);
  }
};

export const updateWorkStyleVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const workStyleVersion = await getWorkStyleVersionByNumber(versionNumber);

    if (!workStyleVersion) {
      res.status(404).json({ message: 'Work style version not found' });
      return;
    }

    workStyleVersion.set(req.body);
    if (workStyleVersion.isActive) {
      workStyleVersion.status = 'active';
    } else if (workStyleVersion.status === 'active') {
      workStyleVersion.status = 'archived';
    }

    await workStyleVersion.save();
    if (workStyleVersion.isActive) {
      await ensureSingleActiveWorkStyleVersion(workStyleVersion.version);
    }

    res.status(200).json(workStyleVersion);
  } catch (error) {
    next(error);
  }
};

export const duplicateWorkStyleVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sourceVersion = Number(req.params.version);
    const source = await getWorkStyleVersionByNumber(sourceVersion);

    if (!source) {
      res.status(404).json({ message: 'Work style version not found' });
      return;
    }

    const { version, title, summary } = req.body as {
      version: number;
      title?: string;
      summary?: string;
    };

    if (await getWorkStyleVersionByNumber(version)) {
      res.status(409).json({
        message: 'A work style version with this version already exists',
      });
      return;
    }

    const sourceQuestions = await WorkStyleQuestion.find({
      version: sourceVersion,
    }).lean();

    const clone = await WorkStyleVersion.create({
      version,
      title: title ?? source.title,
      summary: summary ?? source.summary,
      profiles: source.profiles,
      isActive: false,
      status: 'draft',
    });

    if (sourceQuestions.length > 0) {
      await WorkStyleQuestion.insertMany(
        sourceQuestions.map((question) => ({
          code: question.code,
          text: question.text,
          dimension: question.dimension,
          polarity: question.polarity,
          order: question.order,
          isActive: question.isActive,
          version,
          versionId: clone._id,
        }))
      );
    }

    res.status(201).json(clone);
  } catch (error) {
    next(error);
  }
};

export const activateWorkStyleVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const workStyleVersion = await getWorkStyleVersionByNumber(versionNumber);

    if (!workStyleVersion) {
      res.status(404).json({ message: 'Work style version not found' });
      return;
    }

    const activeQuestionsCount = await WorkStyleQuestion.countDocuments({
      version: versionNumber,
      isActive: true,
    });

    if (activeQuestionsCount === 0) {
      res.status(400).json({
        message:
          'Cannot activate a work style version without active questions',
      });
      return;
    }

    workStyleVersion.isActive = true;
    workStyleVersion.status = 'active';
    await workStyleVersion.save();
    await ensureSingleActiveWorkStyleVersion(versionNumber);

    res.status(200).json(workStyleVersion);
  } catch (error) {
    next(error);
  }
};

export const deactivateWorkStyleVersionAdmin = async (
  req: Request<{ version: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const versionNumber = Number(req.params.version);
    const workStyleVersion = await getWorkStyleVersionByNumber(versionNumber);

    if (!workStyleVersion) {
      res.status(404).json({ message: 'Work style version not found' });
      return;
    }

    workStyleVersion.isActive = false;
    workStyleVersion.status = 'archived';
    await workStyleVersion.save();

    res.status(200).json(workStyleVersion);
  } catch (error) {
    next(error);
  }
};

export const listWorkStyleQuestionsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as PaginationQuery & {
      version?: number;
      isActive?: boolean;
      dimension?: string;
    };
    const { page, limit, skip } = buildPagination(query);
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: 'i' } },
        { text: { $regex: q, $options: 'i' } },
      ];
    }
    if (typeof query.version === 'number') filter.version = query.version;
    if (typeof query.isActive === 'boolean') filter.isActive = query.isActive;
    if (query.dimension) filter.dimension = query.dimension;

    const [items, total] = await Promise.all([
      WorkStyleQuestion.find(filter)
        .sort({ version: -1, order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkStyleQuestion.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkStyleQuestionAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const version = await getWorkStyleVersionByNumber(req.body.version);
    if (!version) {
      res.status(400).json({ message: 'Work style version does not exist' });
      return;
    }

    const question = await WorkStyleQuestion.create({
      ...req.body,
      versionId: version._id,
      polarity: req.body.polarity ?? 1,
      order: req.body.order ?? 0,
    });

    res.status(201).json(question);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: 'A work style question with this code already exists',
      });
      return;
    }
    next(error);
  }
};

export const updateWorkStyleQuestionAdmin = async (
  req: Request<IdParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const update = { ...req.body };

    if (typeof update.version === 'number') {
      const version = await getWorkStyleVersionByNumber(update.version);
      if (!version) {
        res.status(400).json({ message: 'Work style version does not exist' });
        return;
      }
      update.versionId = version._id;
    }

    const question = await WorkStyleQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!question) {
      res.status(404).json({ message: 'Work style question not found' });
      return;
    }

    res.status(200).json(question);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        message: 'A work style question with this code already exists',
      });
      return;
    }
    next(error);
  }
};
