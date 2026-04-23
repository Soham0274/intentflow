require('dotenv').config();

// List all available models for this API key
fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`)
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('API Error:', JSON.stringify(data.error, null, 2));
      return;
    }
    const models = (data.models || []).filter(m =>
      m.supportedGenerationMethods?.includes('generateContent')
    );
    console.log(`\nAvailable models (${models.length}) that support generateContent:\n`);
    models.forEach(m => {
      console.log(`  • ${m.name.replace('models/', '')} — ${m.displayName}`);
    });
  })
  .catch(err => console.error('Fetch error:', err.message));
