const express = require('express');
const router = express.Router();
const autoService = require('../../services/automation.service');
const { success, error } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { z } = require('zod');

const triggerSchema = z.object({
  workflowId: z.string(),
  payload: z.record(z.any())
});

router.post('/trigger', requireAuth, validate(triggerSchema), asyncHandler(async (req, res) => {
  const data = await autoService.triggerWorkflow(req.body.workflowId, req.body.payload);
  success(res, data);
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  await autoService.handleWebhookCallback(req.body, secret);
  success(res, { status: 'acknowledged' });
}));

router.get('/status/:id', requireAuth, asyncHandler(async (req, res) => {
  const data = await autoService.getExecutionStatus(req.params.id);
  success(res, data);
}));

router.get('/workflows', requireAuth, asyncHandler(async (req, res) => {
  const data = await autoService.listWorkflows();
  success(res, data);
}));

module.exports = router;