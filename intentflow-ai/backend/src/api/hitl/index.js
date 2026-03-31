const express = require('express');
const router = express.Router();
const hitlService = require('../../services/hitl.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { z } = require('zod');

const confirmSchema = z.object({ hitlId: z.string().uuid() });
const rejectSchema = z.object({ hitlId: z.string().uuid(), reason: z.string().optional() });
const editSchema = z.object({
  patches: z.array(z.object({
    title: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_date: z.string().nullable().optional(),
    category: z.string().optional(),
    description: z.string().nullable().optional()
  }))
});

router.get('/pending', requireAuth, asyncHandler(async (req, res) => {
  const data = await hitlService.getPendingTasks(req.user.id);
  success(res, data);
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const data = await hitlService.getTaskById(req.params.id, req.user.id);
  success(res, data);
}));

router.post('/confirm', requireAuth, validate(confirmSchema), asyncHandler(async (req, res) => {
  const data = await hitlService.confirmTask(req.body.hitlId, req.user.id);
  success(res, data);
}));

router.post('/reject', requireAuth, validate(rejectSchema), asyncHandler(async (req, res) => {
  const data = await hitlService.rejectTask(req.body.hitlId, req.user.id, req.body.reason);
  success(res, data);
}));

router.patch('/edit/:id', requireAuth, validate(editSchema), asyncHandler(async (req, res) => {
  const data = await hitlService.editTask(req.params.id, req.body.patches, req.user.id);
  success(res, data);
}));

module.exports = router;