const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/index');

const genAI = new GoogleGenerativeAI(config.GEMINI.API_KEY);

// DO NOT set responseMimeType: 'application/json' per Prompt (1)
const geminiModel = genAI.getGenerativeModel({
  model: config.GEMINI.MODEL,
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 800,
  }
});

module.exports = geminiModel;