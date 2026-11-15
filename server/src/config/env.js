const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  GOOGLE_BOOKS_API_KEY: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

module.exports = { env: parsed.data };

