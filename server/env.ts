/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at startup using Zod schema.
 * Ensures the application fails fast if critical configuration is missing.
 * 
 * Features:
 * - Type-safe environment variables
 * - Required vs optional validation
 * - Default values for development
 * - Transformations (string to number, etc.)
 * - Clear error messages on startup
 */

import { z } from 'zod';
import logger from './logger';

// Define the schema for environment variables
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Server configuration
  PORT: z
    .string()
    .default('5000')
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  // Database configuration
  DATABASE_URL: z
    .string()
    .url()
    .optional() // Optional for file-based storage in development
    .or(z.literal(''))
    .transform((val) => val || undefined),

  // JWT secrets (critical for production)
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security')
    .optional()
    .default('dev-access-secret-change-in-production-min-32-chars'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
    .optional()
    .default('dev-refresh-secret-change-in-production-min-32-chars'),

  // Session configuration
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security')
    .optional()
    .default('dev-session-secret-change-in-production-min-32-chars'),

  // CORS configuration
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .default('http://localhost:5173,http://localhost:5000')
    .transform((val) => val.split(',').map((origin) => origin.trim())),

  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .default('900000') // 15 minutes
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().positive()),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .default('100')
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().positive()),

  // Optional Replit configuration
  REPL_ID: z.string().optional(),
});

// Export the validated and typed environment variables
export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    // Parse and validate environment variables
    const env = envSchema.parse(process.env);

    // Production safety checks
    if (env.NODE_ENV === 'production') {
    const productionWarnings: string[] = [];

    if (env.JWT_ACCESS_SECRET.includes('dev-')) {
      productionWarnings.push(
        '⚠️  JWT_ACCESS_SECRET is using default development value in production!'
      );
    }

    if (env.JWT_REFRESH_SECRET.includes('dev-')) {
      productionWarnings.push(
        '⚠️  JWT_REFRESH_SECRET is using default development value in production!'
      );
    }

    if (env.SESSION_SECRET.includes('dev-')) {
      productionWarnings.push(
        '⚠️  SESSION_SECRET is using default development value in production!'
      );
    }

    if (!env.DATABASE_URL) {
      productionWarnings.push(
        '⚠️  DATABASE_URL is not set. Using file-based storage is not recommended for production.'
      );
    }

    if (productionWarnings.length > 0) {
      logger.error('Production security warnings detected:', {
        warnings: productionWarnings,
      });
      
      // In strict production mode, we could throw an error here
      // Uncomment the next line to enforce secure production configuration
      // throw new Error('Production security requirements not met. See warnings above.');
    }
  }

    // Log successful validation
    logger.info('Environment variables validated successfully', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      hasDatabaseUrl: !!env.DATABASE_URL,
      allowedOrigins: env.ALLOWED_ORIGINS,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment variable validation failed:', {
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });

      console.error('\n❌ Environment Variable Validation Failed:\n');
      for (const err of error.errors) {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      }
      console.error(
        '\nPlease check your .env file and ensure all required variables are set.\n'
      );

      process.exit(1);
    }

    throw error;
  }
}

export const env = validateEnv();
