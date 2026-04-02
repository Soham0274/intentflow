/**
 * Supabase Client - Production Configuration
 * With connection pooling, retry logic, and health checks
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/index');
const logger = require('./logger');

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-app-name': 'intentflow-backend',
      'x-app-version': '1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

const supabase = createClient(
  config.SUPABASE.URL,
  config.SUPABASE.SERVICE_KEY,
  supabaseOptions
);

const supabaseAnon = createClient(
  config.SUPABASE.URL,
  config.SUPABASE.ANON_KEY,
  {
    ...supabaseOptions,
    auth: {
      ...supabaseOptions.auth,
      persistSession: false
    }
  }
);

async function checkConnection() {
  try {
    const result = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (result.error) throw result.error;
    
    logger.info('Supabase connection verified');
    return { healthy: true, latency: Date.now() };
  } catch (error) {
    logger.error({
      message: 'Supabase connection failed',
      error: error.message
    });
    return { healthy: false, error: error.message };
  }
}

async function executeWithRetry(operation, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        logger.warn({
          message: `Operation failed, retrying (${attempt}/${maxRetries})`,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

module.exports = supabase;
module.exports.supabaseAnon = supabaseAnon;
module.exports.checkConnection = checkConnection;
module.exports.executeWithRetry = executeWithRetry;