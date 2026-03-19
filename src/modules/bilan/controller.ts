import { NextFunction, Request, Response } from 'express';

import { BilanCompetence } from '@/models/BilanCompetence';
import * as AnswerService from '@/services/bilan/answer';
import * as ComputeBilanService from '@/services/bilan/computeBilan';
import * as QuestionService from '@/services/bilan/question';
import { BilanResultDTO } from '@/types/bilan';

export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const version = await QuestionService.getLatestVersion();
    const questions = await QuestionService.getQuestionsByVersion(version);

    return res.status(200).json({ version, questions });
  } catch (error) {
    next(error);
  }
};

export const submitAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const { version, answers } = req.body;

    const answerSet = await AnswerService.createAnswerSet({
      userId,
      version,
      answers,
    });

    return res.status(200).json({
      message: 'Answers saved',
      answerSet,
    });
  } catch (error) {
    next(error);
  }
};

export const generateBilan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const { version } = req.body;
    if (!version) {
      return res.status(400).json({ message: 'Missing version' });
    }

    const answers = await AnswerService.getAnswerSet(userId, version);
    if (!answers) {
      return res.status(400).json({
        message: 'No answers found for this user and version',
      });
    }

    const questions = await QuestionService.getQuestionsByVersion(version);

    const bilan = await ComputeBilanService.computeAndStoreBilan(
      questions,
      answers
    );

    return res.status(200).json({
      message: 'Bilan generated successfully',
      bilan,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBilan = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bilan = await BilanCompetence.findOne({
      user: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!bilan) {
      return res.status(404).json({ message: 'No bilan found' });
    }

    const dto: BilanResultDTO = {
      id: bilan._id.toString(),
      version: bilan.version,
      createdAt: bilan.createdAt.toISOString(),
      conclusion: bilan.conclusion,
      investigation: {
        topValues: bilan.investigation.topValues,
        topWorkConditions: bilan.investigation.topWorkConditions,
        interestsProfile: bilan.investigation.interestsProfile,
      },
    };

    return res.status(200).json({ bilan: dto });
  } catch (e) {
    next(e);
  }
};
