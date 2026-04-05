/**
 * Global App Configuration (Production-Validated)
 */
require('dotenv').config();
const { z } = require('zod');
// const logger = require('../utils/logger'); // Removed to break circular dependency

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
  
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-2.5-pro'),
  
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GROQ_AUDIO_MODEL: z.string().default('whisper-large-v3-turbo'),
  
  N8N_BASE_URL: z.string().url().optional().or(z.literal('')),
  N8N_API_KEY: z.string().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  N8N_WEBHOOK_BASE_URL: z.string().url().optional().or(z.literal('')),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional().or(z.literal('')),
  
  FRONTEND_URL: z.string().url().default('http://localhost:8081'),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  DB_POOL_MIN: z.string().regex(/^\d+$/).transform(Number).default('2'),
  DB_POOL_MAX: z.string().regex(/^\d+$/).transform(Number).default('10'),
  
  GRACEFUL_SHUTDOWN_TIMEOUT: z.string().regex(/^\d+$/).transform(Number).default('10000')
});

let config;

try {
  const env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_AUDIO_MODEL: process.env.GROQ_AUDIO_MODEL,
    N8N_BASE_URL: process.env.N8N_BASE_URL,
    N8N_API_KEY: process.env.N8N_API_KEY,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
    N8N_WEBHOOK_BASE_URL: process.env.N8N_WEBHOOK_BASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    FRONTEND_URL: process.env.FRONTEND_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    DB_POOL_MIN: process.env.DB_POOL_MIN,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    GRACEFUL_SHUTDOWN_TIMEOUT: process.env.GRACEFUL_SHUTDOWN_TIMEOUT
  });

  config = {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    
    SUPABASE: {
      URL: env.SUPABASE_URL,
      ANON_KEY: env.SUPABASE_ANON_KEY,
      SERVICE_KEY: env.SUPABASE_SECRET_KEY,
    },
    
    GEMINI: {
      API_KEY: env.GEMINI_API_KEY,
      MODEL: env.GEMINI_MODEL,
    },
    
    GROQ: {
      API_KEY: env.GROQ_API_KEY,
      AUDIO_MODEL: env.GROQ_AUDIO_MODEL,
    },
    
    N8N: {
      BASE_URL: env.N8N_BASE_URL || '',
      API_KEY: env.N8N_API_KEY || '',
      WEBHOOK_SECRET: env.N8N_WEBHOOK_SECRET || '',
      WEBHOOK_BASE_URL: env.N8N_WEBHOOK_BASE_URL || ''
    },
    
    GOOGLE: {
      CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
      CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
      REDIRECT_URI: env.GOOGLE_REDIRECT_URI || ''
    },
    
    APP: {
      FRONTEND_URL: env.FRONTEND_URL
    },
    
    LOG_LEVEL: env.LOG_LEVEL,
    
    RATE_LIMIT: {
      WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
      MAX: env.RATE_LIMIT_MAX
    },
    
    DB_POOL: {
      MIN: env.DB_POOL_MIN,
      MAX: env.DB_POOL_MAX
    },
    
    SHUTDOWN_TIMEOUT: env.GRACEFUL_SHUTDOWN_TIMEOUT
  };

  console.warn(`[Config] Validated successfully in ${env.NODE_ENV} mode on port ${env.PORT}`);

} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    console.error('❌ Environment validation failed:');
    missingVars.forEach(v => console.error(`  - ${v.field}: ${v.message}`));
    
    process.exit(1);
  }
  
  throw error;
}

module.exports = Object.freeze(config);