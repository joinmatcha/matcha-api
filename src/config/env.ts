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

  ROME_CLIENT_ID: z.string().optional(),
  ROME_CLIENT_SECRET: z.string().optional(),
  ROME_TOKEN_URL: z
    .string()
    .default(
      'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire'
    ),
  ROME_METIERS_API_URL: z
    .string()
    .default('https://api.francetravail.io/partenaire/rome-metiers'),
  ROME_FICHES_METIERS_API_URL: z
    .string()
    .default('https://api.francetravail.io/partenaire/rome-fiches-metiers'),
  ROME_SCOPES: z.string().default('api_rome-metiersv1 nomenclatureRome'),
  ROME_REQUEST_DELAY_MS: z.coerce.number().int().min(1000).default(1100),
  ROME_FETCH_FICHES: z.coerce.boolean().default(true),
  ROME_SYNC_MODE: z.enum(['summary', 'details', 'full']).default('full'),

  MARKET_STATS_API_URL: z
    .string()
    .default(
      'https://api.francetravail.io/partenaire/stats-offres-demandes-emploi'
    ),
  MARKET_STATS_SCOPES: z
    .string()
    .default('offresetdemandesemploi api_stats-offres-demandes-emploiv1'),
  MARKET_STATS_REQUEST_DELAY_MS: z.coerce.number().int().min(100).default(250),
  MARKET_STATS_TERRITORY_TYPE: z.string().default('NAT'),
  MARKET_STATS_TERRITORY_CODE: z.string().default('FR'),
  MARKET_STATS_SYNC_LIMIT: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional()
  ),

  DAILY_SWIPE_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
});

export const env = envSchema.parse(process.env);
