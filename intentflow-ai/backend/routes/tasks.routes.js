const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET all tasks for a user
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user_id)
    .neq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, tasks: data });
});

// GET single task
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true, task: data });
});

// POST create task
router.post('/', async (req, res) => {
  const {
    user_id, title, description,
    due_date, due_time, priority,
    category, confidence_score, metadata
  } = req.body;

  if (!user_id || !title) {
    return res.status(400).json({ error: 'user_id and title are required' });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id,
      title,
      description:      description || null,
      due_date:         due_date    || null,
      due_time:         due_time    || null,
      priority:         priority    || 'medium',
      category:         category    || 'work',
      status:           'active',
      confidence_score: confidence_score || null,
      metadata:         metadata    || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, task: data });
});

// PUT update task
router.put('/:id', async (req, res) => {
  const updates = req.body;
  delete updates.id;
  delete updates.user_id;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, task: data });
});

// PATCH complete task
router.patch('/:id/complete', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status:       'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, task: data });
});

// DELETE task
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = router;
