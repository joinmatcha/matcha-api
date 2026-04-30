import mongoose from 'mongoose';

import { RomeMetier } from '@/models/RomeMetier';
import { Swipe } from '@/models/Swipe';
import { SwipeQuota } from '@/models/SwipeQuota';
import {
  getDeck,
  getJobById,
  getRecommendedJobs,
  listJobs,
  swipeJob,
} from '@/modules/jobs/controller';
import { buildRomeMetier, createRomeMetier } from '@/tests/helpers/rome';

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Jobs controller unit branches', () => {
  beforeEach(async () => {
    await RomeMetier.deleteMany({});
    await Swipe.deleteMany({});
    await SwipeQuota.deleteMany({});
    jest.restoreAllMocks();
  });

  it('should list jobs with riasec query arrays and clamp oversized limits', async () => {
    await RomeMetier.create([
      buildRomeMetier({
        code: 'M1403',
        label: 'Data Analyst',
        domain: { label: 'Tech' },
        riasec: { major: 'I', codes: ['RIASEC_I'] },
      }),
      buildRomeMetier({
        code: 'B1603',
        label: 'Designer',
        domain: { label: 'Design' },
        riasec: { major: 'A', codes: ['RIASEC_A'] },
      }),
      buildRomeMetier({
        code: 'D1402',
        label: 'Sales',
        domain: { label: 'Sales' },
        riasec: { major: 'E', codes: ['RIASEC_E'] },
      }),
    ]);

    const req: any = {
      query: {
        riasec: ['RIASEC_I,RIASEC_A'],
        limit: '999',
      },
    };
    const res = createResponse();
    const next = jest.fn();

    await listJobs(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.jobs).toHaveLength(2);
    expect(payload.jobs.map((job: any) => job.title).sort()).toEqual([
      'Data Analyst',
      'Designer',
    ]);
  });

  it('should return unauthorized responses directly from controller guards', async () => {
    const deckRes = createResponse();
    const recommendedRes = createResponse();
    const swipeRes = createResponse();
    const next = jest.fn();

    await getDeck({} as any, deckRes, next);
    await getRecommendedJobs({} as any, recommendedRes, next);
    await swipeJob({ body: {} } as any, swipeRes, next);

    expect(deckRes.status).toHaveBeenCalledWith(401);
    expect(recommendedRes.status).toHaveBeenCalledWith(401);
    expect(swipeRes.status).toHaveBeenCalledWith(401);
  });

  it('should validate swipe payload branches inside the controller', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const next = jest.fn();

    const missingFieldsRes = createResponse();
    await swipeJob(
      { user: { id: userId }, body: {} } as any,
      missingFieldsRes,
      next
    );
    expect(missingFieldsRes.status).toHaveBeenCalledWith(400);

    const invalidActionRes = createResponse();
    await swipeJob(
      {
        user: { id: userId },
        body: {
          jobId: new mongoose.Types.ObjectId().toString(),
          action: 'maybe',
        },
      } as any,
      invalidActionRes,
      next
    );
    expect(invalidActionRes.status).toHaveBeenCalledWith(400);

    const invalidIdRes = createResponse();
    await swipeJob(
      {
        user: { id: userId },
        body: { jobId: 'not-an-id', action: 'like' },
      } as any,
      invalidIdRes,
      next
    );
    expect(invalidIdRes.status).toHaveBeenCalledWith(400);
  });

  it('should release the reserved quota slot when swipe creation hits a duplicate key', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const job = await createRomeMetier({ label: 'Backend Developer' });

    jest.spyOn(Swipe, 'findOne').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    } as any);
    jest.spyOn(Swipe, 'countDocuments').mockResolvedValue(0 as any);
    jest.spyOn(SwipeQuota, 'findOneAndUpdate').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId,
      dayKey: '2026-03-20',
      count: 1,
    } as any);
    const releaseSpy = jest
      .spyOn(SwipeQuota, 'updateOne')
      .mockResolvedValue({ acknowledged: true, modifiedCount: 1 } as any);
    const duplicateError = new Error('duplicate swipe') as Error & {
      code?: number;
    };
    duplicateError.code = 11000;
    jest.spyOn(Swipe, 'create').mockRejectedValue(duplicateError);

    const res = createResponse();
    const next = jest.fn();

    await swipeJob(
      {
        user: { id: userId },
        body: { jobId: job._id.toString(), action: 'like' },
      } as any,
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(releaseSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ce métier a déjà été swipé aujourd'hui",
    });
  });

  it('should reject invalid job ids directly in getJobById', async () => {
    const res = createResponse();
    const next = jest.fn();

    await getJobById({ params: { id: 'invalid-id' } } as any, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid job id' });
  });
});
