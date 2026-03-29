require('dotenv').config();
console.log('GEMINI KEY LOADED:', process.env.GEMINI_API_KEY ? 
  process.env.GEMINI_API_KEY.substring(0, 8) + '...' : 'NOT FOUND');
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
const nlpModule = require('./services/nlp');
console.log('NLP Module loaded:', nlpModule);
const { extractTaskIntent } = nlpModule;

const taskRoutes = require('./routes/tasks.routes');
app.use('/api/tasks', taskRoutes);

const hitlRoutes = require('./routes/hitl.routes');
app.use('/api/hitl', hitlRoutes);

const authRouter = require('./routes/auth.routes');
app.use('/auth', authRouter);

app.get('/test-db', async (req, res) => {
  const supabase = require('./config/supabase');
  const { data, error } = await supabase.from('tasks').select('count');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Database connected!' });
});

app.post('/api/nlp/extract', async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length === 0) {
    return res.status(400).json({ error: 'Input text is required' });
  }

  if (input.length > 500) {
    return res.status(400).json({ error: 'Input too long — max 500 characters' });
  }

  const result = await extractTaskIntent(input.trim());

  if (!result.success) {
    return res.status(500).json({ error: 'NLP extraction failed', details: result.error });
  }

  res.json(result);

});

app.listen(process.env.PORT || 3001, () => console.log('Server running on port ' + (process.env.PORT || 3001)));