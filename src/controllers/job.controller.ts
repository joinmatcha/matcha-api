import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { BilanCompetence } from '@/models/BilanCompetence';
import { Job } from '@/models/Job';
import { mapJobLabels } from '@/utils/jobLabelMapper';

export const getRecommendedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bilan = await BilanCompetence.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!bilan) {
      return res.status(404).json({ message: 'No bilan found' });
    }

    return res.status(200).json({
      jobs: bilan.conclusion.recommendedJobs,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findOne({ _id: id, isActive: true });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let recommendation;

    if (req.user) {
      const bilan = await BilanCompetence.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      recommendation = bilan?.conclusion.recommendedJobs.find(
        (j) => j.id === id,
      );
    }

    return res.status(200).json({
      job: {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        sector: job.sector,

        riasec: mapJobLabels.riasec(job.riasec),

        competences: mapJobLabels.competences(job.competences),
        softSkills: mapJobLabels.softSkills(job.softSkills),
        values: mapJobLabels.values(job.values),
        workConditions: mapJobLabels.workConditions(job.workConditions),

        missions: job.missions ?? [],
        dailyTasks: job.dailyTasks ?? [],
        evolutionPaths: job.evolutionPaths ?? [],

        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        growthOutlook: job.growthOutlook,
      },
      recommendation,
    });
  } catch (error) {
    next(error);
  }
};
