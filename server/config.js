import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5001),
  MONGODB_URI: z.string().min(1),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  GENERATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(3).default(2),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  MAX_SCENARIO_LENGTH: z.coerce.number().int().positive().default(3000),
  MAX_CASE_PAYLOAD_BYTES: z.coerce.number().int().positive().default(150000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid server configuration:', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  process.exit(1);
}
if (parsed.data.NODE_ENV === 'production' && parsed.data.COOKIE_SECURE !== 'true') {
  console.error('Invalid server configuration: COOKIE_SECURE must be true in production.');
  process.exit(1);
}
export const config = parsed.data;
