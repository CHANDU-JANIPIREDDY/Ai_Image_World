'use strict';

/**
 * config/env.js — Environment loading & validation.
 *
 * Loads .env, validates all variables with zod, and exports a single frozen
 * `env` object. The app imports `env` from here instead of reading
 * process.env directly, so a missing/invalid variable fails fast at boot
 * rather than surfacing as an undefined value at runtime.
 *
 * Secrets (JWT, Cloudinary) are REQUIRED in production but fall back to dev
 * defaults in non-production so early phases boot without full credentials.
 */

require('dotenv').config();

const { z } = require('zod');

const isProd = process.env.NODE_ENV === 'production';

// In production, secrets must be supplied (validated by `schema`). In dev/test,
// missing OR empty values fall back to a safe default so the app still boots.
const requiredInProd = (schema, devDefault) =>
  isProd
    ? schema
    : z.preprocess((v) => (v === undefined || v === '' ? devDefault : v), z.string());

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  // Database — required in production (no localhost default, so a missing value
  // fails fast with a clear message instead of an ECONNREFUSED at connect time).
  MONGO_URI: isProd
    ? z.string().min(1, 'MONGO_URI is required in production (set your MongoDB Atlas connection string)')
    : z.string().min(1).default('mongodb://127.0.0.1:27017/ai_image_world'),

  // JWT — access & refresh (API Spec §1.4)
  JWT_ACCESS_SECRET: requiredInProd(
    z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    'dev_access_secret_change_me_dev_only_32+'
  ),
  JWT_REFRESH_SECRET: requiredInProd(
    z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    'dev_refresh_secret_change_me_dev_only_32'
  ),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Cloudinary — optional so the API can boot without it. Image uploads need
  // these set (in production the local-disk fallback is disabled); without them
  // the app runs fine and only the upload endpoint returns a clear error.
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  // CORS — comma-separated list of allowed client origins
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  // Optional cache/queue layer
  REDIS_URL: z.string().optional(),

  // Dev-only: use an ephemeral in-memory MongoDB (mongodb-memory-server).
  USE_MEMORY_DB: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`❌ Invalid environment variables:\n${issues}`);
  process.exit(1);
}

// Normalize derived values once, here.
const env = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isDev: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
  allowedOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((o) => o.trim()),
  useMemoryDb: parsed.data.USE_MEMORY_DB === 'true',
});

// Non-fatal heads-up: uploads won't work in production without Cloudinary.
if (env.isProd && !env.CLOUDINARY_CLOUD_NAME) {
  // eslint-disable-next-line no-console
  console.warn('⚠️  Cloudinary is not configured — image uploads will be unavailable.');
}

module.exports = env;
