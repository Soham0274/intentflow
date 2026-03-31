/**
 * Global App Configuration
 */
require('dotenv').config();

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'GEMINI_API_KEY'
];

for (const envVar of REQUIRED_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE: {
    URL: process.env.SUPABASE_URL,
    ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SERVICE_KEY: process.env.SUPABASE_SECRET_KEY,
  },
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY,
    MODEL: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  N8N: {
    BASE_URL: process.env.N8N_BASE_URL || '',
    API_KEY: process.env.N8N_API_KEY || '',
    WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET || '',
    WEBHOOK_BASE_URL: process.env.N8N_WEBHOOK_BASE_URL || ''
  },
  APP: {
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8081'
  }
};

module.exports = Object.freeze(config);