import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Load .env from repo root (cwd is apps/api in dev)
loadEnv({ path: resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  JWT_SECRET: z
    .string()
    .optional()
    .default('dev-secret-change-me-min-32-chars-for-local')
    .refine((v) => v && v.length >= 16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .optional()
    .default('dev-refresh-secret-change-me-min-32-chars')
    .refine((v) => v && v.length >= 16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(
      `\n❌ Environment validation failed:\n${issues}\n\n` +
        `Copy .env.example to .env and fill in required values.\n`
    );
    process.exit(1);
  }

  const isProd = result.data.NODE_ENV === 'production';
  if (isProd) {
    const jwt = process.env.JWT_SECRET ?? '';
    const refresh = process.env.JWT_REFRESH_SECRET ?? '';
    if (jwt.length < 32) {
      console.error('\n❌ JWT_SECRET must be at least 32 characters in production.\n');
      process.exit(1);
    }
    if (refresh.length < 32) {
      console.error('\n❌ JWT_REFRESH_SECRET must be at least 32 characters in production.\n');
      process.exit(1);
    }
  }

  return result.data;
}

export const env = validateEnv();
