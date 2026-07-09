import 'express';

declare module 'express' {
  interface Request {
    requestId?: string;
    user?: {
      id: string;
      email?: string;
      role?: 'user' | 'admin';
    };
  }
}
