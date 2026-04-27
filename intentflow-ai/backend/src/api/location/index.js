const express = require('express');
const router = express.Router();
const locationService = require('../../services/location.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { z } = require('zod');

// Schemas
const geocodeSchema = z.object({ q: z.string().min(2) });
const reverseSchema = z.object({ 
  lat: z.union([z.string(), z.number()]), 
  lon: z.union([z.string(), z.number()]) 
});
const nearbySchema = z.object({
  lat: z.union([z.string(), z.number()]),
  lon: z.union([z.string(), z.number()]),
  tag: z.string().min(1),
  radius: z.union([z.string(), z.number()]).optional()
});
const autocompleteSchema = z.object({ q: z.string().min(1) });

// Routes

/**
 * @route GET /api/location/geocode
 * @desc Forward geocoding
 */
router.get('/geocode', requireAuth, validate(geocodeSchema, 'query'), asyncHandler(async (req, res) => {
  const { q } = req.query;
  const result = await locationService.geocode(q);
  success(res, result);
}));

/**
 * @route GET /api/location/reverse
 * @desc Reverse geocoding
 */
router.get('/reverse', requireAuth, validate(reverseSchema, 'query'), asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  const result = await locationService.reverse(lat, lon);
  success(res, result);
}));

/**
 * @route GET /api/location/nearby
 * @desc Nearby search
 */
router.get('/nearby', requireAuth, validate(nearbySchema, 'query'), asyncHandler(async (req, res) => {
  const { lat, lon, tag, radius } = req.query;
  const result = await locationService.nearby(lat, lon, tag, radius);
  success(res, result);
}));

/**
 * @route GET /api/location/autocomplete
 * @desc Autocomplete
 */
router.get('/autocomplete', requireAuth, validate(autocompleteSchema, 'query'), asyncHandler(async (req, res) => {
  const { q } = req.query;
  const result = await locationService.autocomplete(q);
  success(res, result);
}));

/**
 * @route GET /api/location/balance
 * @desc Get API usage balance
 */
router.get('/balance', requireAuth, asyncHandler(async (req, res) => {
  const result = await locationService.getBalance();
  success(res, result);
}));

/**
 * @route GET /api/location/staticmap
 * @desc Proxy static map image
 */
router.get('/staticmap', requireAuth, asyncHandler(async (req, res) => {
  const { lat, lon, zoom, width, height, markers } = req.query;
  const imageBuffer = await locationService.staticMap({ lat, lon, zoom, width, height, markers });
  
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=86400'); // 24h cache
  res.send(imageBuffer);
}));

module.exports = router;
