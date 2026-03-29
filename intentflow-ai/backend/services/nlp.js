const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('[NLP] Loading NLP service...');

let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('[NLP] genAI initialized successfully');
} catch (err) {
  console.error('[NLP] Failed to initialize genAI:', err.message);
}

const SYSTEM_PROMPT = `
You are a task extraction AI for IntentFlow AI productivity app.
Extract structured task data from natural language input.

Return ONLY valid JSON with this exact schema:
{
  "title":       "concise action-oriented task name (max 80 chars)",
  "description": "any extra details from the input, or null",
  "due_date":    "YYYY-MM-DD or null",
  "due_time":    "HH:MM in 24h format or null",
  "priority":    "high" or "medium" or "low",
  "category":    "work" or "personal" or "urgent" or "routine" or "health",
  "people":      ["array of mentioned names"] or []
}

Date rules:
- "tomorrow"     → calculate tomorrow's actual date
- "next Friday"  → calculate the actual coming Friday's date
- "morning"      → 09:00
- "afternoon"    → 14:00
- "evening"      → 18:00
- "end of week"  → coming Friday
- No date mentioned → due_date and due_time both null

Priority rules:
- "urgent", "ASAP", "critical" → high
- "when you can", "sometime"   → low
- Default                      → medium

Return ONLY the JSON object. No explanation, no markdown, no backticks.
`;

  async function extractTaskIntent(inputText) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          responseMimeType: "application/json"
        }
      });

      const prompt = `${SYSTEM_PROMPT}\n\nUser input: "${inputText}"\n\nJSON response:`;
      const result = await model.generateContent(prompt);

    // Safely extract text
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
      || result.response?.text?.()
      || '';

    console.log('[NLP] Raw response:', text);

    if (!text.trim()) {
      return { success: false, error: 'Gemini returned empty response' };
    }

    // Strip markdown backticks if present
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('[NLP] Clean text:', cleanText);

    const data = JSON.parse(cleanText);

    // Confidence scoring
    let confidence = 30;
    if (data.title?.length > 3)     confidence += 8;
    if (data.title?.length > 10)    confidence += 7;
    if (data.due_date)              confidence += 20;
    if (data.due_time)              confidence += 15;
    if (data.people?.length > 0)    confidence += 10;
    if (data.category !== 'work')   confidence += 5;
    if (data.priority !== 'medium') confidence += 5;
    confidence = Math.min(confidence, 100);

    // Safety checks
    if (!data.title || data.title.length < 3) {
      confidence = Math.min(confidence, 40);
    }
    if (data.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) {
      confidence = Math.min(confidence, 60);
      data.due_date = null;
    }

    const autoApprove = confidence >= parseInt(
      process.env.AUTO_APPROVE_THRESHOLD || 95
    );

    return { success: true, data, confidence, autoApprove };

  } catch (error) {
    console.error('[NLP] Gemini Error:', error.message);
    return { success: false, error: error.message };
  }
}

console.log('[NLP] Defining extractTaskIntent, type:', typeof extractTaskIntent);
module.exports = { extractTaskIntent };