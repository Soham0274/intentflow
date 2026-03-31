const express = require('express');
const router = express.Router();
const userRepository = require('../../repositories/user.repository');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');

router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  success(res, user);
}));

router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const updated = await userRepository.updateProfile(req.user.id, req.body);
  success(res, updated);
}));

router.get('/preferences', requireAuth, asyncHandler(async (req, res) => {
  const prefs = await userRepository.getPreferences(req.user.id) || {};
  success(res, prefs);
}));

router.put('/preferences', requireAuth, asyncHandler(async (req, res) => {
  const updated = await userRepository.upsertPreferences(req.user.id, req.body);
  success(res, updated);
}));

module.exports = router;