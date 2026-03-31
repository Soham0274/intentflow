const geminiModel = require('../utils/geminiClient');
const hitlRepository = require('../repositories/hitl.repository');
const { NLPValidationError } = require('../utils/ApiError');
const { z } = require('zod');

const SYSTEM_PROMPT = `You are a task extraction AI for IntentFlow AI productivity app.
Extract structured task data from natural language input.

Return ONLY a JSON array containing objects with this exact schema:
[
  {
    "title":       "concise action-oriented task name (max 80 chars)",
    "description": "any extra details from the input, or null",
    "due_date":    "YYYY-MM-DD or null",
    "due_time":    "HH:MM in 24h format or null",
    "priority":    "high" or "medium" or "low",
    "category":    "work" or "personal" or "urgent" or "routine" or "health",
    "people":      ["array of mentioned names"] or [],
    "confidence":  0.0 to 1.0 (your self-assessed confidence)
  }
]

IMPORTANT RULES:
- If multiple tasks exist, separate them into multiple objects in the array.
- "confidence" MUST be a number between 0 and 1.
- If the input is ambiguous or unclear, set confidence below 0.7.
- If you are very confident in all extracted fields, set confidence above 0.85.

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

Priority rules:
- "urgent", "ASAP" → high
- "when you can", "sometime" → low
- Default → medium

Return ONLY the JSON array. No explanation, no markdown backticks.`;

const arraySchema = z.array(z.object({
  title:       z.string().min(1).max(80),
  description: z.string().nullable().default(null),
  due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  due_time:    z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
  priority:    z.enum(['low', 'medium', 'high']).default('medium'),
  category:    z.enum(['work', 'personal', 'urgent', 'routine', 'health']).default('work'),
  people:      z.array(z.string()).default([]),
  confidence:  z.number().min(0).max(1).optional()
}));

function parseResponse(raw) {
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new NLPValidationError('Invalid JSON', { raw: clean, err: err.message });
  }

  // Ensure parsing returns an array
  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  const result = arraySchema.safeParse(parsed);
  if (!result.success) {
    throw new NLPValidationError('Schema validation failed', { errors: result.error.errors });
  }

  return result.data;
}

async function extractTasks(rawText, userId) {
  const prompt = `${SYSTEM_PROMPT}\n\nUser input: "${rawText}"\n\nJSON array response:`;
  
  let result;
  try {
    const rawRes = await geminiModel.generateContent(prompt);
    const text = rawRes.response?.candidates?.[0]?.content?.parts?.[0]?.text
              || rawRes.response?.text?.() || '';
              
    result = parseResponse(text);
  } catch (err) {
    throw new NLPValidationError('Gemini API Error: ' + err.message);
  }

  // Map to apply heuristics and defaults
  const tasks = result.map(t => {
    let conf = t.confidence !== undefined ? Math.round(t.confidence * 100) : 30;
    delete t.confidence;
    return {
      ...t,
      confidence_score: conf
    };
  });

  // Create queue entry
  const queueEntry = await hitlRepository.createHITLEntry({
    user_id: userId,
    raw_input: rawText,
    extracted_tasks: tasks,
    status: 'pending_review'
  });

  return { hitlId: queueEntry.id, tasks };
}

async function parseIntent(text) {
  // Lightweight call
  const prompt = `Classify the following text into a simple intent block. Return ONLY JSON:
{ "intent": "string", "priority": "high|medium|low", "category": "work|personal|urgent|routine|health" }
Text: "${text}"`;
  
  const rawRes = await geminiModel.generateContent(prompt);
  const rawClean = (rawRes.response?.text?.() || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(rawClean);
  } catch(e) {
    return { intent: 'unknown', priority: 'medium', category: 'work' };
  }
}

module.exports = {
  extractTasks,
  parseIntent
};