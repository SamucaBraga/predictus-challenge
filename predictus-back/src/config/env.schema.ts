import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),
  BASE_URL: z.url(),
  FRONTEND_ORIGIN: z.url(),
  ABANDONMENT_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(5),
  MFA_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  MFA_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  RESUME_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  VIACEP_BASE_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;