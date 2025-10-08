import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(5 * 1024 * 1024),

  DATABASE_URL: z.string().url().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('images'),

  ANTHROPIC_API_KEY: z.string(),
  ANTHROPIC_MODEL_DEFAULT: z.string().default('claude-3-haiku-20240307'),
  ANTHROPIC_MODEL_FALLBACK: z.string().default('claude-3-5-sonnet-20241022'),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().default(1200),

  // Automation flags (dev-friendly)
  AUTO_MIGRATE: z.coerce.boolean().default(true),
  AUTO_BOOTSTRAP_DEFAULTS: z.coerce.boolean().default(true),

  // Default admin (dev only)
  DEFAULT_ADMIN_EMAIL: z.string().default('user@foodtracker.local'),
  DEFAULT_ADMIN_PASSWORD: z.string().default('password123'),
  DEFAULT_ADMIN_NAME: z.string().default('Food Tracker User'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;
export function env(): Env {
  if (cached) return cached;
  cached = EnvSchema.parse(process.env);
  return cached;
}
