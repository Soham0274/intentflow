const express = require('express');
const router = express.Router();
const nlpService = require('../../services/nlp.service');
const { success } = require('../../utils/responseHelper');
const asyncHandler = require('../../utils/asyncHandler');
const requireAuth = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { nlpLimiter } = require('../../middleware/rateLimit.middleware');
const { z } = require('zod');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const hitlRepository = require('../../repositories/hitl.repository');

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

router.post('/extract', requireAuth, nlpLimiter, validate(extractSchema), asyncHandler(async (req, res) => {
  const result = await nlpService.extractTasks(req.body.text, req.user.id);
  success(res, result);
}));

router.post('/parse', requireAuth, nlpLimiter, validate(parseSchema), asyncHandler(async (req, res) => {
  const result = await nlpService.parseIntent(req.body.text);
  success(res, result);
}));

router.post('/validate', requireAuth, nlpLimiter, validate(validateSchema), asyncHandler(async (req, res) => {
  // Re-run parse intent on stringified edited obj to 'validate' it if needed
  const result = await nlpService.parseIntent(JSON.stringify(req.body.task));
  success(res, result);
}));

router.post('/voice', requireAuth, nlpLimiter, upload.single('audio'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No audio file provided' });
  }
  
  console.warn('[NLP Voice] Received file:', {
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  
  const audioBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'audio/wav';
  
  try {
    // Groq transcribes audio, then Gemini extracts tasks from transcript
    const result = await nlpService.extractTasksFromAudio(audioBase64, mimeType, req.user.id);
    return success(res, result);
  } catch (err) {
    console.error('[NLP Voice] Processing failed:', err.message);
    console.error('[NLP Voice] Falling back to manual transcription...');
    
    // FALLBACK: Create a placeholder and let user type the transcript
    const fallbackTranscript = '[Voice recorded - transcription unavailable. Please type your intent below.]';
    
    const queueEntry = await hitlRepository.createHITLEntry({
      user_id: req.user.id,
      raw_input: fallbackTranscript,
      extracted_tasks: [],
      status: 'pending_review'
    });
    
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