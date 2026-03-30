/**
 * Environment Variable Validator
 * Fails fast on startup if required variables are missing
 */

function validateEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
    'PORT',
  ];

  const recommended = [
    'N8N_WEBHOOK_BASE_URL',
    'N8N_WEBHOOK_SECRET',
    'NODE_ENV',
    'AUTO_APPROVE_THRESHOLD',
  ];

  const missing = required.filter(key => !process.env[key]);
  const missingRecommended = recommended.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('═══════════════════════════════════════════');
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach(key => console.error(`   → ${key}`));
    console.error('═══════════════════════════════════════════');
    process.exit(1);
  }

  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:');
    missingRecommended.forEach(key => console.warn(`   → ${key}`));
  }

  // Validate specific values
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('❌ FATAL: PORT must be a valid number (1-65535)');
    process.exit(1);
  }

  const threshold = parseInt(process.env.AUTO_APPROVE_THRESHOLD || '95');
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    console.warn('⚠️  AUTO_APPROVE_THRESHOLD should be 0-100, defaulting to 95');
    process.env.AUTO_APPROVE_THRESHOLD = '95';
  }

  console.log('✅ Environment variables validated');
  return true;
}

module.exports = validateEnv;
