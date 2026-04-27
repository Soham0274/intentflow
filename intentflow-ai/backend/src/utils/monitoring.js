const locationService = require('../services/location.service');
const logger = require('./logger');

/**
 * Monitor LocationIQ balance and log if low
 */
async function checkLocationIQBalance() {
  try {
    const balance = await locationService.getBalance();
    if (balance) {
      const remaining = parseInt(balance.balance?.day || '0');
      const limit = parseInt(balance.limit?.day || '1');
      const percentLeft = (remaining / limit) * 100;

      if (percentLeft < 10) {
        logger.warn(`[Monitoring] LocationIQ balance is low: ${remaining}/${limit} (${percentLeft.toFixed(1)}% left)`);
      } else {
        logger.info(`[Monitoring] LocationIQ balance: ${remaining}/${limit} (${percentLeft.toFixed(1)}% left)`);
      }
    }
  } catch (err) {
    logger.error(`[Monitoring] Failed to check LocationIQ balance: ${err.message}`);
  }
}

// Check every 12 hours
const MONITOR_INTERVAL = 12 * 60 * 60 * 1000;

function startMonitoring() {
  // Initial check
  checkLocationIQBalance();
  
  // Schedule
  setInterval(checkLocationIQBalance, MONITOR_INTERVAL);
}

module.exports = { startMonitoring };
