require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
`;

async function test() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
      // If we add this back, what happens? Let's NOT add it yet, simulate exact user state.
    }
  });

  const prompt = `${SYSTEM_PROMPT}\n\nUser input: "Call John tomorrow at 3pm"\n\nJSON response:`;
  const result = await model.generateContent(prompt);
  console.log("Response:", JSON.stringify(result.response, null, 2));
}

test();
