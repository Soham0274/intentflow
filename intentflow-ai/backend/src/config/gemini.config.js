/**
 * Gemini Config — IntentFlow AI
 * Gemini model selection and generation params
 */

const config = require('./index');

const geminiConfig = {
  model: config.gemini.model,
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 500,
  },
};

// NOTE: responseMimeType: 'application/json' is intentionally NOT set
// Known Gemini quirk — causes empty responses

module.exports = geminiConfig;