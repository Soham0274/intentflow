require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
  generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
});

console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL);
console.log('API_KEY prefix:', process.env.GEMINI_API_KEY?.substring(0, 12));

model.generateContent('Say hello in JSON: {"hello": true}')
  .then(r => {
    const text = r.response?.text?.() || '';
    console.log('SUCCESS — response:', text.substring(0, 200));
    process.exit(0);
  })
  .catch(err => {
    console.error('GEMINI ERROR:', err.message);
    // Check if it's a model not found issue
    if (err.message.includes('models/')) {
      console.log('\nHint: Try switching GEMINI_MODEL to: gemini-1.5-flash or gemini-1.5-pro');
    }
    process.exit(1);
  });
