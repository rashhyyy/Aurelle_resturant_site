import dns from 'dns';
import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure Windows environments resolve Atlas SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) throw new Error('PORT must be a valid number');
      return parsed;
    }),
  // Support both MONGODB_URI (standard) and MONGO_URI (legacy alias)
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .or(z.undefined())
    .transform((val) => val || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aurelle'),
  // Support both CLIENT_ORIGIN (standard) and CLIENT_URL (legacy alias)
  CLIENT_ORIGIN: z
    .string()
    .min(1, 'CLIENT_ORIGIN is required')
    .or(z.undefined())
    .transform((val) => val || process.env.CLIENT_URL || 'http://localhost:3000'),
  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters long for secure session hashing')
    .default('aurelle_dev_secret_session_key_9f82d1c3e4b5a6789012345678abcdef'),
  SESSION_NAME: z.string().default('aurelle.sid'),
  COOKIE_MAX_AGE_DAYS: z
    .string()
    .default('7')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 7 : parsed;
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ FATAL: Backend Configuration Validation Failed:');
  const errors = parsed.error.format();
  for (const [key, value] of Object.entries(errors)) {
    if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
      console.error(`  - ${key}: ${(value._errors as string[]).join(', ')}`);
    }
  }
  console.error('='.repeat(60) + '\n');
  process.exit(1);
}

// Export parsed and validated environment configuration
export const env = {
  ...parsed.data,
  // Provide backwards-compatible aliases
  CLIENT_URL: parsed.data.CLIENT_ORIGIN,
  MONGO_URI: parsed.data.MONGODB_URI,
};
