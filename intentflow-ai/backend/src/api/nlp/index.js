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
  
  console.log('[NLP Voice] Received file:', {
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  
  const audioBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'audio/wav';
  
  try {
    // Try Gemini voice processing first
    const result = await nlpService.extractTasksFromAudio(audioBase64, mimeType, req.user.id);
    return success(res, result);
  } catch (geminiErr) {
    console.log('[NLP Voice] Gemini failed:', geminiErr.message);
    console.log('[NLP Voice] Falling back to mock transcription...');
    
    // FALLBACK: Create a placeholder and let user type the transcript
    // This happens when Gemini can't process audio (format issues, API limits, etc.)
    const fallbackTranscript = '[Voice recorded - transcription unavailable. Please type your intent below.]';
    
    const queueEntry = await nlpService.hitlRepository?.createHITLEntry?.({
      user_id: req.user.id,
      raw_input: fallbackTranscript,
      extracted_tasks: [],
      status: 'pending_review'
    }) || { id: 'fallback-' + Date.now() };
    
    return success(res, { 
      hitlId: queueEntry.id,
      transcript: fallbackTranscript,
      tasks: [],
      fallback: true,
      message: 'Voice recorded. Transcription unavailable - please type your intent.'
    });
  }
}));

module.exports = router;