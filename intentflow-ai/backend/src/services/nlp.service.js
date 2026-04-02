const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/index');
const hitlRepository = require('../repositories/hitl.repository');
const taskRepository = require('../repositories/task.repository');
const { NLPValidationError } = require('../utils/ApiError');
const { z } = require('zod');

// ─── Gemini Clients ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);

// Standard model for text tasks (low token budget is fine)
const textModel = genAI.getGenerativeModel({
  model: config.GEMINI.MODEL,
  generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
});

// Separate model for audio — needs more tokens for transcript + JSON
const audioModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',          // audio-capable model
  generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
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

const audioResponseSchema = z.object({
  transcript: z.string().default(''),
  tasks:      z.array(taskSchema).default([])
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractJSON(raw) {
  // Strip markdown fences
  let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try { return JSON.parse(clean); } catch { /* ignore parse error */ }

  // Try to find a JSON object {...} — handle truncated by finding complete object
  const objMatch = clean.match(/\{[\s\S]*?\}(?=\s*$|\s*\{)/) || clean.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* ignore parse error */ }
  }

  // Try to find a JSON array [...]
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch { /* ignore parse error */ }
  }

  // Try to repair truncated JSON by adding closing braces
  if (clean.includes('{') && !clean.includes('}')) {
    try { return JSON.parse(clean + '}}'); } catch { /* ignore parse error */ }
    try { return JSON.parse(clean + '}'); } catch { /* ignore parse error */ }
  }

  return null;
}

function formatTasks(tasks = []) {
  return tasks.map(t => {
    const conf = t.confidence !== undefined ? Math.round(t.confidence * 100) : 30;
    const { confidence, ...rest } = t;
    return { ...rest, confidence_score: conf };
  });
}

/**
 * Persist extracted tasks to the tasks table
 */
async function persistExtractedTasks(extractedTasks, userId, hitlId) {
  const tasksToCreate = extractedTasks.map(t => ({
    title: t.title,
    description: t.description,
    due_date: t.due_date,
    due_time: t.due_time,
    priority: t.priority || 'medium',
    category: t.category || 'work',
    status: 'pending_review',
    user_id: userId,
    hitl_id: hitlId,
    extracted_from: t.people?.length ? `mentioned: ${t.people.join(', ')}` : null
  }));

  if (tasksToCreate.length === 0) return [];

  try {
    return await taskRepository.bulkCreate(tasksToCreate);
  } catch (err) {
    console.warn('[NLP] Failed to persist tasks to tasks table:', err.message);
    return [];
  }
}

// ─── Text Prompts ─────────────────────────────────────────────────────────────
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

Date rules:
- tomorrow      → next day's date
- next Friday   → coming Friday's date
- morning       → 09:00, afternoon → 14:00, evening → 18:00, tonight → 20:00
- EOD           → today 17:00, ASAP → today high priority

Priority rules:
- urgent / ASAP → high
- sometime / when you can → low
- default → medium`;

const AUDIO_PROMPT = `You are a voice task extraction AI. You will receive an audio recording.

Step 1: Transcribe the audio exactly.
Step 2: Extract any tasks, reminders, or to-dos mentioned.

Return ONLY this JSON object — no markdown, no backticks, nothing else:
{
  "transcript": "exact words spoken in the audio",
  "tasks": [
    {
      "title":       "concise task name (max 80 chars)",
      "description": "extra details or null",
      "due_date":    "YYYY-MM-DD or null",
      "due_time":    "HH:MM (24h) or null",
      "priority":    "high" | "medium" | "low",
      "category":    "work" | "personal" | "urgent" | "routine" | "health",
      "people":      [],
      "confidence":  number between 0.0 and 1.0
    }
  ]
}

Date rules: tomorrow=next day, morning=09:00, afternoon=14:00, evening=18:00, tonight=20:00, ASAP=today+high priority.

If the audio is silent, unclear, or has no tasks → return: {"transcript": "", "tasks": []}
IMPORTANT: Return ONLY the JSON object above. Nothing before or after it.`;

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Extract tasks from plain text
 */
async function extractTasks(rawText, userId) {
  const prompt = `${TASK_EXTRACTION_PROMPT}\n\nUser input: "${rawText}"\n\nJSON array:`;

  let tasks = [];
  try {
    const rawRes = await textModel.generateContent(prompt);
    const text = rawRes.response?.text?.() || '';
    const parsed = extractJSON(text);

    if (Array.isArray(parsed)) {
      const validated = z.array(taskSchema).safeParse(parsed);
      tasks = validated.success ? validated.data : [];
    }
  } catch (err) {
    throw new NLPValidationError('Gemini text error: ' + err.message);
  }

  const formattedTasks = formatTasks(tasks);

  const queueEntry = await hitlRepository.createHITLEntry({
    user_id: userId,
    raw_input: rawText,
    extracted_tasks: formattedTasks,
    status: 'pending_review'
  });

  // Persist tasks to the tasks table
  const persistedTasks = await persistExtractedTasks(formattedTasks, userId, queueEntry.id);

  return { hitlId: queueEntry.id, tasks: formattedTasks, persistedCount: persistedTasks.length };
}

/**
 * Lightweight intent classification
 */
async function parseIntent(text) {
  const prompt = `Classify this text. Return ONLY JSON, no markdown:
{"intent": "string", "priority": "high|medium|low", "category": "work|personal|urgent|routine|health"}
Text: "${text}"`;

  try {
    const rawRes = await textModel.generateContent(prompt);
    const raw = rawRes.response?.text?.() || '';
    const parsed = extractJSON(raw);
    if (parsed && parsed.intent) return parsed;
  } catch { /* ignore intent parse errors, return default */ }

  return { intent: 'unknown', priority: 'medium', category: 'work' };
}

/**
 * Transcribe audio and extract tasks using Gemini multimodal
 */
async function extractTasksFromAudio(audioBase64, mimeType, userId) {
  // Gemini supports: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac, audio/webm
  const safeMimeType = mimeType || 'audio/webm';

  console.log('[NLP Audio] Starting audio processing');
  console.log('[NLP Audio] MimeType:', safeMimeType);
  console.log('[NLP Audio] Base64 size:', audioBase64.length, 'chars (~', Math.round(audioBase64.length * 0.75 / 1024), 'KB)');
  console.log('[NLP Audio] Model: gemini-2.5-flash');
  console.log('[NLP Audio] API Key present:', !!config.GEMINI.API_KEY);

  let transcript = '';
  let tasks = [];

  try {
    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: safeMimeType
      }
    };

    console.log('[NLP Audio] Calling Gemini...');
    const rawRes = await audioModel.generateContent([audioPart, { text: AUDIO_PROMPT }]);
    console.log('[NLP Audio] Gemini responded');

    const rawText = rawRes.response?.text?.() || '';

    console.log('[NLP Audio] Raw response:');
    console.log('--- START ---');
    console.log(rawText);
    console.log('--- END ---');

    if (!rawText.trim()) {
      console.warn('[NLP Audio] Empty response from Gemini');
      transcript = '';
      tasks = [];
    } else {
      const parsed = extractJSON(rawText);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const validated = audioResponseSchema.safeParse(parsed);
        if (validated.success) {
          transcript = validated.data.transcript;
          tasks = validated.data.tasks;
          console.log('[NLP Audio] Valid response parsed');
          console.log('[NLP Audio] Transcript:', transcript);
          console.log('[NLP Audio] Tasks found:', tasks.length);
        } else {
          console.warn('[NLP Audio] Schema validation failed:', validated.error.errors);
          // Best effort extraction
          transcript = parsed.transcript || '';
          tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        }
      } else {
        // Gemini returned something unexpected — treat entire text as transcript
        console.warn('[NLP Audio] Could not parse JSON, using raw text as transcript');
        transcript = rawText.substring(0, 500);
        tasks = [];
      }
    }

  } catch (err) {
    console.error('[NLP Audio] Gemini error:', err.message);

    // Check for specific Gemini error types
    if (err.message?.includes('SAFETY')) {
      console.error('[NLP Audio] Safety filter triggered');
    } else if (err.message?.includes('INVALID_ARGUMENT')) {
      console.error('[NLP Audio] Invalid audio format — Gemini rejected the file');
    } else if (err.message?.includes('quota') || err.message?.includes('429')) {
      console.error('[NLP Audio] Rate limit / quota exceeded');
    }

    throw new NLPValidationError('Audio processing failed: ' + err.message);
  }

  const formattedTasks = formatTasks(tasks);

  const queueEntry = await hitlRepository.createHITLEntry({
    user_id: userId,
    raw_input: transcript || '[Audio Input - no transcript]',
    extracted_tasks: formattedTasks,
    status: 'pending_review'
  });

  // Persist tasks to the tasks table
  const persistedTasks = await persistExtractedTasks(formattedTasks, userId, queueEntry.id);

  return {
    hitlId:     queueEntry.id,
    transcript,
    tasks:      formattedTasks,
    persistedCount: persistedTasks.length
  };
}

module.exports = { extractTasks, parseIntent, extractTasksFromAudio };