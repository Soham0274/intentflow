/**
 * Health Check Endpoint - Production-Ready
 * Comprehensive health monitoring for all services
 */

const express = require('express');
const router = express.Router();
const { checkConnection } = require('../../utils/supabaseClient');
const logger = require('../../utils/logger');

router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing key',
      groq:   process.env.GROQ_API_KEY   ? 'configured' : 'missing key',
    }
  };

  try {
    const dbHealth = await checkConnection();
    healthCheck.checks.database = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      latency: dbHealth.latency,
      ...(dbHealth.error && { error: dbHealth.error })
    };

    const memoryUsage = process.memoryUsage();
    healthCheck.checks.memory = {
      status: 'healthy',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };

    healthCheck.checks.uptime = {
      status: 'healthy',
      seconds: Math.round(process.uptime()),
      formatted: formatUptime(process.uptime())
    };

    const allHealthy = Object.values(healthCheck.checks)
      .every(check => check.status === 'healthy');

    healthCheck.status = allHealthy ? 'ok' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;

    logger.http({
      message: 'Health check performed',
      status: healthCheck.status,
      checks: healthCheck.checks
    });

    return res.status(statusCode).json(healthCheck);

  } catch (error) {
    logger.error({
      message: 'Health check failed',
      error: error.message,
      stack: error.stack
    });

    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/ready', async (req, res) => {
  try {
    const dbHealth = await checkConnection();
    
    if (!dbHealth.healthy) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database connection failed'
      });
    }

    return res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

module.exports = router;