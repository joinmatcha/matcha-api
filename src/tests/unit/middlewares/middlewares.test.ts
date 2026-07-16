import jwt from 'jsonwebtoken';

import { env } from '@/config/env';
import { requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { errorHandler } from '@/middlewares/error.middleware';
import { createRateLimiter } from '@/middlewares/rateLimit.middleware';

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middlewares', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('should reject requests without a bearer token', () => {
      const req: any = { headers: {} };
      const res = createResponse();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing authentication token',
      });
    });

    it('should attach the JWT payload to req.user when the token is valid', () => {
      const token = jwt.sign(
        { id: 'user-1', email: 'user@example.com', role: 'admin' },
        env.JWT_SECRET
      );
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res = createResponse();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toMatchObject({
        id: 'user-1',
        email: 'user@example.com',
        role: 'admin',
      });
    });

    it('should reject invalid tokens', () => {
      const req: any = {
        headers: { authorization: 'Bearer invalid-token' },
      };
      const res = createResponse();
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token',
      });
    });
  });

  describe('requireAdmin', () => {
    it('should reject requests without an authenticated user', () => {
      const req: any = {};
      const res = createResponse();
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should reject non-admin users', () => {
      const req: any = { user: { id: 'user-1', role: 'user' } };
      const res = createResponse();
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin access required',
      });
    });

    it('should allow admin users through', () => {
      const req: any = { user: { id: 'admin-1', role: 'admin' } };
      const res = createResponse();
      const next = jest.fn();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRateLimiter', () => {
    it('should allow the first request and then block when the quota is exceeded', () => {
      const rateLimiter = createRateLimiter({
        max: 1,
        windowMs: 10_000,
        message: 'Too many requests',
      });

      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
      const req: any = { ip: '127.0.0.1' };
      const firstRes = createResponse();
      const secondRes = createResponse();
      const next = jest.fn();

      rateLimiter(req, firstRes, next);
      rateLimiter(req, secondRes, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(secondRes.setHeader).toHaveBeenCalledWith('Retry-After', '10');
      expect(secondRes.status).toHaveBeenCalledWith(429);
      expect(secondRes.json).toHaveBeenCalledWith({
        message: 'Too many requests',
      });

      nowSpy.mockRestore();
    });

    it('should use the unknown key when req.ip is missing and reset after the window', () => {
      const rateLimiter = createRateLimiter({
        max: 1,
        windowMs: 1_000,
        message: 'Too many requests',
      });

      const nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1_000)
        .mockReturnValueOnce(1_500)
        .mockReturnValueOnce(2_001);

      const req: any = {};
      const firstRes = createResponse();
      const secondRes = createResponse();
      const thirdRes = createResponse();
      const next = jest.fn();

      rateLimiter(req, firstRes, next);
      rateLimiter(req, secondRes, next);
      rateLimiter(req, thirdRes, next);

      expect(secondRes.status).toHaveBeenCalledWith(429);
      expect(thirdRes.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(2);

      nowSpy.mockRestore();
    });
  });

  describe('errorHandler', () => {
    it('should return a production-safe payload by default', () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const res = createResponse();
      const next = jest.fn();
      const error = new Error('Boom');

      errorHandler(error, {} as any, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Boom',
        stack: undefined,
      });

      process.env.NODE_ENV = previousNodeEnv;
    });

    it('should expose stack traces in development and honor custom status codes', () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const res = createResponse();
      const next = jest.fn();
      const error = new Error('Validation failed') as Error & {
        status?: number;
      };
      error.status = 422;
      error.stack = 'stack-trace';

      errorHandler(error, {} as any, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        stack: 'stack-trace',
      });

      process.env.NODE_ENV = previousNodeEnv;
    });
  });
});
