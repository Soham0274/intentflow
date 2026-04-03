const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/index');
const hitlRepository = require('../repositories/hitl.repository');
const taskRepository = require('../repositories/task.repository');
const { NLPValidationError } = require('../utils/ApiError');
const { z } = require('zod');

// ─── Gemini Client ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);

const textModel = genAI.getGenerativeModel({
  model: config.GEMINI.MODEL,
  generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
  //                              ↑ lower = more deterministic JSON output
});

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const taskSchema = z.object({
  title:       z.string().min(1).max(80),
  description: z.string().nullable().default(null),
  due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  due_time:    z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  category:    z.enum(['work', 'personal', 'urgent', 'routine', 'health']).default('work'),
  people:      z.array(z.string()).default([]),
  confidence:  z.number().min(0).max(1).default(0.5)
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJSON(raw) {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch { /* try next */ }
  const objMatch = clean.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch { /* try next */ } }
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch { /* try next */ } }
  return null;
}

// NOTE: formatTasks is called ONCE inside extractTasks().
// Do NOT call it again in extractTasksFromAudio — result.tasks are already formatted.
function formatTasks(rawTasks = []) {
  return rawTasks.map(t => {
    const conf = t.confidence !== undefined ? Math.round(t.confidence * 100) : 30;
    const taskCopy = { ...t };
    delete taskCopy.confidence;
    return { ...taskCopy, confidence_score: conf };
  });
}

// ─── Groq Transcription ───────────────────────────────────────────────────────
async function transcribeWithGroq(audioBase64, mimeType) {
  // BUG FIX: config.GROQ may not exist in config/index.js — fall back to process.env
  const groqApiKey = config.GROQ?.API_KEY || process.env.GROQ_API_KEY;
  const groqModel  = config.GROQ?.AUDIO_MODEL || process.env.GROQ_AUDIO_MODEL || 'whisper-large-v3-turbo';

  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not set. Add it to your .env file.');
  }

  // BUG FIX: Whisper requires a filename with the correct extension to detect codec
  const ext = mimeType.includes('webm') ? 'webm'
            : mimeType.includes('mp4')  ? 'mp4'
            : mimeType.includes('wav')  ? 'wav'
            : mimeType.includes('ogg')  ? 'ogg'
            : mimeType.includes('mp3')  ? 'mp3'
            : mimeType.includes('mpeg') ? 'mp3'
            : 'webm';

  const buffer = Buffer.from(audioBase64, 'base64');
  const form   = new FormData();
  form.append('file', buffer, { filename: `audio.${ext}`, contentType: mimeType });
  form.append('model', groqModel);
  form.append('response_format', 'verbose_json'); // includes word timestamps
  form.append('language', 'en');                   // force English, faster + more accurate
  form.append('temperature', '0');                 // deterministic transcription

  console.warn('[GROQ:Transcription] Model:', groqModel, '| File: audio.' + ext, '| Size:', Math.round(buffer.length / 1024) + 'KB');

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${groqApiKey}` },
        timeout: 30000
      }
    );
    const text = response.data?.text || '';
    console.warn('[GROQ:Transcription] ✅ Result:', text.substring(0, 120));
    return text;
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error('[GROQ:Transcription] ❌ Error:', errorMsg);
    const groqError = new Error(`Groq API error: ${errorMsg}`);
    groqError.cause = err;
    throw groqError;
  }
}

// ─── Task Persistence ─────────────────────────────────────────────────────────
async function persistExtractedTasks(formattedTasks, userId, hitlId) {
  if (!formattedTasks.length) return [];

  const tasksToCreate = formattedTasks.map(t => ({
    title:          t.title,
    description:    t.description || null,
    due_date:       t.due_date && t.due_time ? `${t.due_date}T${t.due_time}:00Z` : (t.due_date || null),
    priority:       t.priority   || 'medium',
    category:       t.category   || 'work',
    status:         'pending_review',
    user_id:        userId,
    hitl_id:        hitlId,
    extracted_from: t.people?.length ? `mentioned: ${t.people.join(', ')}` : null
  }));

  try {
    // BUG FIX: bulkCreate may not exist — fall back to individual creates
    if (typeof taskRepository.bulkCreate === 'function') {
      return await taskRepository.bulkCreate(tasksToCreate);
    }
    const created = [];
    for (const task of tasksToCreate) {
      try { created.push(await taskRepository.create(task)); } catch (e) {
        console.warn('[NLP:Persistence] Failed to create task:', task.title, e.message);
      }
    }
    return created;
  } catch (err) {
    console.warn('[NLP:Persistence] Persistence error:', err.message);
    return [];
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────────
const TASK_EXTRACTION_PROMPT = `You are a task extraction AI. Extract structured tasks from natural language.

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "title":       "concise action-oriented task name (max 80 chars)",
    "description": "extra details or null",
    "due_date":    "YYYY-MM-DD or null",
    "due_time":    "HH:MM (24h) or null",
    "priority":    "high" | "medium" | "low",
    "category":    "work" | "personal" | "urgent" | "routine" | "health",
    "people":      ["names mentioned"] or [],
    "confidence":  number between 0.0 and 1.0
  }
]

Date rules: tomorrow=next day, next Friday=coming Friday, morning=09:00, afternoon=14:00, evening=18:00, tonight=20:00, EOD=today 17:00, ASAP=today+high
Priority: urgent/ASAP=high | sometime/when you can=low | default=medium`;

// ─── Service Functions ────────────────────────────────────────────────────────

async function extractTasks(rawText, userId, persist = true) {
  console.warn('[GEMINI:Extraction] Analysing:', rawText.substring(0, 80));

  // Inject today's date so Gemini can calculate relative dates correctly
  const today = new Date().toISOString().split('T')[0];
  const prompt = `Today's date is ${today}.\n\n${TASK_EXTRACTION_PROMPT}\n\nUser input: "${rawText}"\n\nJSON array:`;

  let formattedTasks = [];
  try {
    const rawRes = await textModel.generateContent(prompt);
    const text   = rawRes.response?.text?.() || '';
    const parsed = extractJSON(text);

    if (Array.isArray(parsed)) {
      const validated = z.array(taskSchema).safeParse(parsed);
      // formatTasks called here — only once per extraction
      formattedTasks = validated.success ? formatTasks(validated.data) : [];
      console.warn(`[GEMINI:Extraction] ✅ ${formattedTasks.length} tasks extracted`);
    } else {
      console.warn('[GEMINI:Extraction] ⚠️ No valid JSON array returned');
    }
  } catch (err) {
    console.error('[GEMINI:Extraction] ❌ Error:', err.message);
    const validationError = new NLPValidationError('Gemini text error: ' + err.message);
    validationError.cause = err;
    throw validationError;
  }

  // Split tasks by confidence threshold for HITL review
  const highConfidence = formattedTasks.filter(t => t.confidence_score >= 50);
  const needsReview    = formattedTasks.filter(t => t.confidence_score < 50);

  if (needsReview.length > 0) {
    console.warn(`[GEMINI:Extraction] ⚠️ ${needsReview.length} task(s) below confidence threshold → HITL review`);
  }

  if (!persist) {
    return { tasks: formattedTasks, highConfidence, needsReview }; // audio pipeline handles persistence
  }

  const queueEntry     = await hitlRepository.createHITLEntry({
    user_id: userId, raw_input: rawText, extracted_tasks: formattedTasks, status: 'pending_review'
  });
  const persistedTasks = await persistExtractedTasks(highConfidence, userId, queueEntry.id);

  return { hitlId: queueEntry.id, tasks: formattedTasks, highConfidence, needsReview, persistedCount: persistedTasks.length };
}

async function parseIntent(text) {
  const prompt = `Classify this text. Return ONLY JSON, no markdown:
{"intent": "string", "priority": "high|medium|low", "category": "work|personal|urgent|routine|health"}
Text: "${text}"`;

  try {
    const rawRes = await textModel.generateContent(prompt);
    const parsed = extractJSON(rawRes.response?.text?.() || '');
    if (parsed?.intent) return parsed;
  } catch { /* fall through */ }

  return { intent: 'unknown', priority: 'medium', category: 'work' };
}

async function extractTasksFromAudio(audioBase64, mimeType, userId) {
  if (!audioBase64) {
    throw new Error('No audio data provided to NLP service');
  }

  const safeMimeType = mimeType || 'audio/webm';
  console.warn('[NLP:Audio] Pipeline start | Size:', Math.round(audioBase64.length * 0.75 / 1024) + 'KB | Mime:', safeMimeType);

  // STEP 1: Groq Whisper → transcript
  const transcript = await transcribeWithGroq(audioBase64, safeMimeType).catch((err) => {
    console.error('[NLP:Audio] ❌ Transcription failed:', err.message);
    const transcriptionError = new NLPValidationError('Transcription failed: ' + err.message);
    transcriptionError.cause = err;
    throw transcriptionError;
  });

  if (!transcript?.trim()) {
    throw new NLPValidationError('No speech detected in audio');
  }

  // STEP 2: Gemini → tasks (persist=false, no DB write yet)
  const extractionResult = await extractTasks(transcript, userId, false).catch((err) => {
    console.error('[NLP:Audio] ❌ Extraction failed:', err.message);
    const parsingError = new NLPValidationError('Semantic parsing failed: ' + err.message);
    parsingError.cause = err;
    throw parsingError;
  });

  const tasks          = extractionResult.tasks || []; // already formatted — do NOT call formatTasks again
  const highConfidence = extractionResult.highConfidence || [];
  const needsReview    = extractionResult.needsReview || [];

  // STEP 3: Single DB write
  const queueEntry     = await hitlRepository.createHITLEntry({
    user_id: userId, raw_input: transcript, extracted_tasks: tasks, status: 'pending_review'
  });
  const persistedTasks = await persistExtractedTasks(highConfidence, userId, queueEntry.id);

  console.warn('[NLP:Audio] ✅ Complete | HITL:', queueEntry.id, '| Tasks:', tasks.length, '| Persisted:', persistedTasks.length);

  return { hitlId: queueEntry.id, transcript, tasks, highConfidence, needsReview, persistedCount: persistedTasks.length };
}

module.exports = { extractTasks, parseIntent, extractTasksFromAudio };