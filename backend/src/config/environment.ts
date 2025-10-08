import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  ANTHROPIC_MAX_TOKENS: z.string().transform(Number).default('2048'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'),
  ALLOWED_MIME_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const config = {
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL,
    maxTokens: env.ANTHROPIC_MAX_TOKENS,
  },
  upload: {
    dir: env.UPLOAD_DIR,
    maxSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_MIME_TYPES.split(','),
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
