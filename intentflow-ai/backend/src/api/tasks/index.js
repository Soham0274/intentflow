const express = require('express');
const router = express.Router();
const taskService = require('../../services/task.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.string().optional().nullable(),
  category: z.string().optional()
});
const bulkCreateSchema = z.array(createTaskSchema);
const updateSchema = createTaskSchema.partial();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const tasks = await taskService.getAll(req.user.id, req.query);
  success(res, tasks);
}));

router.post('/', requireAuth, validate(createTaskSchema), asyncHandler(async (req, res) => {
  const created = await taskService.create(req.body, req.user.id);
  success(res, created);
}));

router.post('/bulk', requireAuth, validate(bulkCreateSchema), asyncHandler(async (req, res) => {
  const created = await taskService.bulkCreate(req.body, req.user.id);
  success(res, created);
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const task = await taskService.getOne(req.params.id, req.user.id);
  success(res, task);
}));

router.put('/:id', requireAuth, validate(createTaskSchema), asyncHandler(async (req, res) => {
  const task = await taskService.update(req.params.id, req.user.id, req.body);
  success(res, task);
}));

router.patch('/:id', requireAuth, validate(updateSchema), asyncHandler(async (req, res) => {
  const task = await taskService.partialUpdate(req.params.id, req.user.id, req.body);
  success(res, task);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const task = await taskService.softDelete(req.params.id, req.user.id);
  success(res, task);
}));

module.exports = router;