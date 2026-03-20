import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().default('matcha_dev'),
  MONGODB_DB_TEST: z.string().default('matcha_test'),

  CLIENT_URL: z.string().default('*'),
  API_URL: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:8081'),

  APP_NAME: z.string().default('Matcha'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default('no-reply@matcha.com'),
  SMTP_PASS: z.string().optional(),

  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).optional(),
  INITIAL_ADMIN_FIRST_NAME: z.string().default('Admin'),
  INITIAL_ADMIN_LAST_NAME: z.string().default('Matcha'),
  INITIAL_ADMIN_FORCE_PASSWORD_RESET: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
