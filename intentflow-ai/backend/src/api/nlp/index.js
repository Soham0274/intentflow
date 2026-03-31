const express = require('express');
const router = express.Router();
const nlpService = require('../../services/nlp.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { z } = require('zod');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Schema
const extractSchema = z.object({ text: z.string().min(3).max(2000) });
const parseSchema = z.object({ text: z.string().min(3).max(500) });
const validateSchema = z.object({
  task: z.object({
    title: z.string().min(1),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_date: z.string().optional().nullable(),
    category: z.string().optional()
  })
});

router.post('/extract', requireAuth, validate(extractSchema), asyncHandler(async (req, res) => {
  const result = await nlpService.extractTasks(req.body.text, req.user.id);
  success(res, result);
}));

router.post('/parse', requireAuth, validate(parseSchema), asyncHandler(async (req, res) => {
  const result = await nlpService.parseIntent(req.body.text);
  success(res, result);
}));

router.post('/validate', requireAuth, validate(validateSchema), asyncHandler(async (req, res) => {
  // Re-run parse intent on stringified edited obj to 'validate' it if needed
  const result = await nlpService.parseIntent(JSON.stringify(req.body.task));
  success(res, result);
}));

router.post('/voice', requireAuth, upload.single('audio'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No audio file provided' });
  }
  
  const audioBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'audio/wav';
  
  const result = await nlpService.extractTasksFromAudio(audioBase64, mimeType, req.user.id);
  success(res, result);
}));

module.exports = router;