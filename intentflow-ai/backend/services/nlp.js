/**
 * NLP Service — IntentFlow AI
 * Handles Gemini API calls with Zod validation and retry logic
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const { NLPValidationError } = require('../errors/ApiError');

// ─── Zod Schema for NLP Output ────────────────────────────────────────────────
const taskSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(80),
  description: z.string().nullable().default(null),
  due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').nullable().default(null),
  due_time:    z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM').nullable().default(null),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  category:    z.enum(['work', 'personal', 'urgent', 'routine', 'health']).default('work'),
  people:      z.array(z.string()).default([]),
  confidence:  z.number().min(0).max(1).optional(),
});

// ─── Gemini Client ────────────────────────────────────────────────────────────
let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (err) {
  console.error('[NLP] Failed to initialize Gemini client:', err.message);
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a task extraction AI for IntentFlow AI productivity app.
Extract structured task data from natural language input.

Return ONLY valid JSON with this exact schema:
{
  "title":       "concise action-oriented task name (max 80 chars)",
  "description": "any extra details from the input, or null",
  "due_date":    "YYYY-MM-DD or null",
  "due_time":    "HH:MM in 24h format or null",
  "priority":    "high" or "medium" or "low",
  "category":    "work" or "personal" or "urgent" or "routine" or "health",
  "people":      ["array of mentioned names"] or [],
  "confidence":  0.0 to 1.0 (your self-assessed confidence in the extraction accuracy)
}

IMPORTANT RULES:
- "confidence" MUST be a number between 0 and 1 reflecting how confident you are in the extraction
- If the input is ambiguous or unclear, set confidence below 0.7
- If you are very confident in all extracted fields, set confidence above 0.85

Date rules:
- "tomorrow"     → calculate tomorrow's actual date
- "next Friday"  → calculate the actual coming Friday's date
- "morning"      → 09:00
- "afternoon"    → 14:00
- "evening"      → 18:00
- "tonight"      → 20:00
- "end of week"  → coming Friday
- "EOD"          → today's date, 17:00
- "ASAP"         → today's date, priority high
- No date mentioned → due_date and due_time both null

Priority rules:
- "urgent", "ASAP", "critical", "important" → high
- "when you can", "sometime", "low priority", "no rush" → low
- Default → medium

Category rules:
- Work-related keywords (meeting, report, client, deadline, project) → work
- Health keywords (gym, doctor, run, workout, medicine) → health
- Personal keywords (grocery, birthday, family, friend) → personal
- Urgent keywords (emergency, critical, broken, fix now) → urgent
- Routine keywords (clean, laundry, water plants, trash) → routine

Return ONLY the JSON object. No explanation, no markdown, no backticks.

EXAMPLES:

Input: "Call John tomorrow at 3pm"
Output: {"title":"Call John","description":null,"due_date":"2026-03-31","due_time":"15:00","priority":"medium","category":"work","people":["John"],"confidence":0.95}

Input: "Buy groceries sometime this week"
Output: {"title":"Buy groceries","description":null,"due_date":"2026-04-04","due_time":null,"priority":"low","category":"personal","people":[],"confidence":0.80}

Input: "urgent fix the login bug before EOD"
Output: {"title":"Fix the login bug","description":"Needs to be fixed before end of day","due_date":"2026-03-30","due_time":"17:00","priority":"high","category":"urgent","people":[],"confidence":0.90}

Input: "something about things"
Output: {"title":"Handle things","description":"Unclear task from vague input","due_date":null,"due_time":null,"priority":"medium","category":"work","people":[],"confidence":0.30}

Input: "Remind me to take my pills every morning and also call the dentist"
Output: {"title":"Take pills every morning","description":"Also need to call the dentist (separate task recommended)","due_date":null,"due_time":"09:00","priority":"medium","category":"health","people":[],"confidence":0.65}`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Parse and validate raw NLP output against Zod schema
 */
function parseNLPOutput(raw) {
  if (!raw || !raw.trim()) {
    throw new NLPValidationError('Model returned empty response', { raw });
  }

  // Strip markdown backticks if present
  const cleanText = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    throw new NLPValidationError('Model output is not valid JSON', { raw: cleanText, err: err.message });
  }

  // Validate against Zod schema
  const result = taskSchema.safeParse(parsed);

  if (!result.success) {
    throw new NLPValidationError('Model output failed schema validation', {
      raw: cleanText,
      errors: result.error.errors,
    });
  }

  return result.data;
}

/**
 * Call Gemini with exponential backoff retry
 */
async function callGeminiWithRetry(inputText, maxRetries = 3) {
  if (!genAI) {
    throw new NLPValidationError('Gemini client not initialized — check GEMINI_API_KEY');
  }

  const model = genAI.getGenerativeModel({
    model: process.env.NLP_PROVIDER || 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
      // NOTE: responseMimeType: 'application/json' intentionally REMOVED
      // Known Gemini quirk — causes empty responses
    },
  });

  const prompt = `${SYSTEM_PROMPT}\n\nUser input: "${inputText}"\n\nJSON response:`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);

      // Safely extract text
      const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || result.response?.text?.()
        || '';

      return parseNLPOutput(text);
    } catch (err) {
      console.warn(`[NLP] Attempt ${attempt + 1}/${maxRetries} failed:`, err.message);

      if (attempt === maxRetries - 1) {
        throw err;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Main entry point: extract task intent from natural language
 */
async function extractTaskIntent(inputText) {
  try {
    const data = await callGeminiWithRetry(inputText);

    // Calculate confidence score (0-100 scale for backward compatibility)
    let confidence;
    if (data.confidence !== undefined && data.confidence !== null) {
      // Model self-assessed confidence (0-1 → 0-100)
      confidence = Math.round(data.confidence * 100);
    } else {
      // Fallback heuristic scoring
      confidence = 30;
      if (data.title?.length > 3)     confidence += 8;
      if (data.title?.length > 10)    confidence += 7;
      if (data.due_date)              confidence += 20;
      if (data.due_time)              confidence += 15;
      if (data.people?.length > 0)    confidence += 10;
      if (data.category !== 'work')   confidence += 5;
      if (data.priority !== 'medium') confidence += 5;
    }

    confidence = Math.min(confidence, 100);

    // Safety checks
    if (!data.title || data.title.length < 3) {
      confidence = Math.min(confidence, 40);
    }

    const autoApprove = confidence >= parseInt(process.env.AUTO_APPROVE_THRESHOLD || '95');

    // Remove confidence field from data before returning (stored separately)
    const { confidence: _, ...taskData } = data;

    return { success: true, data: taskData, confidence, autoApprove };

  } catch (error) {
    if (error instanceof NLPValidationError) {
      return { success: false, error: error.message, context: error.context };
    }
    console.error('[NLP] Unexpected error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { extractTaskIntent, parseNLPOutput, taskSchema };