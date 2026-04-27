const axios = require('axios');
const config = require('../config/index');

// ─── Simple In-Memory Cache ──────────────────────────────────────────────────
// Cache results for 24 hours (86400000 ms)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Limit cache size to prevent memory leaks (simple LRU-ish)
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// ─── Retry Utility ───────────────────────────────────────────────────────────
async function callLocationIQWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response.data;
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      
      // Retry on 429 (Rate Limit) or 5xx (Server Error)
      const isRetryable = status === 429 || (status >= 500 && status <= 599) || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

      if (!isRetryable || attempt === maxRetries) break;

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[LocationIQ:Retry] Attempt ${attempt}/${maxRetries} failed: ${err.message} — retrying in ${delayMs}ms`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

// ─── Regional Routing Helper ────────────────────────────────────────────────
function getEndpoint(lat, lon) {
  // If coordinates are missing, default to us1
  if (lat === undefined || lon === undefined) return 'https://us1.locationiq.com';

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  // India
  if (latitude >= 8 && latitude <= 37 && longitude >= 68 && longitude <= 97) {
    return 'https://in1.locationiq.com';
  }
  
  // Europe
  if (latitude >= 34 && latitude <= 72 && longitude >= -25 && longitude <= 45) {
    return 'https://eu1.locationiq.com';
  }

  // Default to US
  return 'https://us1.locationiq.com';
}

// ─── Service Methods ────────────────────────────────────────────────────────

/**
 * Forward Geocoding
 */
async function geocode(query) {
  if (!query) return null;
  
  const cacheKey = `geocode:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  if (!token) throw new Error('LOCATIONIQ_ACCESS_TOKEN not configured');

  const url = `https://us1.locationiq.com/v1/search.php?key=${token}&q=${encodeURIComponent(query)}&format=json&limit=5`;
  
  try {
    const data = await callLocationIQWithRetry(url);
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error(`[LocationService:Geocode] Error: ${err.message}`);
    throw err;
  }
}

/**
 * Reverse Geocoding
 */
async function reverse(lat, lon) {
  if (lat === undefined || lon === undefined) return null;

  const cacheKey = `reverse:${lat}:${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  const endpoint = getEndpoint(lat, lon);
  
  const url = `${endpoint}/v1/reverse.php?key=${token}&lat=${lat}&lon=${lon}&format=json&zoom=18`;

  try {
    const data = await callLocationIQWithRetry(url);
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error(`[LocationService:Reverse] Error: ${err.message}`);
    throw err;
  }
}

/**
 * Nearby Search
 */
async function nearby(lat, lon, tag, radius = 5000) {
  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  const endpoint = getEndpoint(lat, lon);
  
  const url = `${endpoint}/v1/nearby.php?key=${token}&lat=${lat}&lon=${lon}&tag=${tag}&radius=${radius}&format=json`;

  try {
    const data = await callLocationIQWithRetry(url);
    return data;
  } catch (err) {
    console.error(`[LocationService:Nearby] Error: ${err.message}`);
    throw err;
  }
}

/**
 * Autocomplete
 */
async function autocomplete(query) {
  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  const url = `https://us1.locationiq.com/v1/autocomplete.php?key=${token}&q=${encodeURIComponent(query)}&format=json&limit=5`;

  try {
    const data = await callLocationIQWithRetry(url);
    return data;
  } catch (err) {
    console.error(`[LocationService:Autocomplete] Error: ${err.message}`);
    throw err;
  }
}

/**
 * Usage Balance
 */
async function getBalance() {
  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  const url = `https://us1.locationiq.com/v1/balance.php?key=${token}&format=json`;

  try {
    const data = await callLocationIQWithRetry(url);
    return data;
  } catch (err) {
    console.error(`[LocationService:Balance] Error: ${err.message}`);
    throw err;
  }
}

/**
 * Static Map Proxy
 */
async function staticMap(params) {
  const token = config.LOCATIONIQ.ACCESS_TOKEN;
  const { lat, lon, zoom, width, height, markers } = params;
  
  const cacheKey = `staticmap:${lat}:${lon}:${zoom}:${width}:${height}:${markers}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `https://maps.locationiq.com/v3/staticmap?key=${token}&center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=${markers}&format=png`;

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    setCached(cacheKey, buffer);
    return buffer;
  } catch (err) {
    console.error(`[LocationService:StaticMap] Error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  geocode,
  reverse,
  nearby,
  autocomplete,
  getBalance,
  staticMap
};
