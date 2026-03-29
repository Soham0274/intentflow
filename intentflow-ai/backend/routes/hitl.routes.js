const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { extractTaskIntent } = require('../services/nlp');

// POST /api/hitl/submit
// Called right after user types input
// Runs NLP and saves to hitl_queue
router.post('/submit', async (req, res) => {
  const { user_id, input_text } = req.body;

  if (!user_id || !input_text) {
    return res.status(400).json({ error: 'user_id and input_text required' });
  }

  // Run NLP extraction
  const nlpResult = await extractTaskIntent(input_text);

  if (!nlpResult.success) {
    return res.status(500).json({ error: 'NLP extraction failed', details: nlpResult.error });
  }

  // Save to hitl_queue
  const { data: queueItem, error } = await supabase
    .from('hitl_queue')
    .insert({
      user_id,
      input_text,
      extracted_data:  nlpResult.data,
      confidence_score: nlpResult.confidence,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // If auto-approve threshold met, skip HITL
  if (nlpResult.autoApprove) {
    // Create task directly
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id,
        title:            nlpResult.data.title,
        description:      nlpResult.data.description || null,
        due_date:         nlpResult.data.due_date     || null,
        due_time:         nlpResult.data.due_time     || null,
        priority:         nlpResult.data.priority     || 'medium',
        category:         nlpResult.data.category     || 'work',
        status:           'active',
        confidence_score: nlpResult.confidence,
        metadata:         { source: 'nlp', input: input_text }
      })
      .select()
      .single();

    if (taskError) return res.status(500).json({ error: taskError.message });

    // Update queue record
    await supabase
      .from('hitl_queue')
      .update({
        action:       'approved',
        final_data:   nlpResult.data,
        task_id:      task.id,
        resolved_at:  new Date().toISOString()
      })
      .eq('id', queueItem.id);

    return res.json({
      success:      true,
      autoApproved: true,
      task,
      queue_id:     queueItem.id,
      confidence:   nlpResult.confidence,
    });
  }

  // Return to frontend for manual HITL review
  res.json({
    success:        true,
    autoApproved:   false,
    queue_id:       queueItem.id,
    extracted_data: nlpResult.data,
    confidence:     nlpResult.confidence,
    message:        'Review required'
  });
});

// POST /api/hitl/approve
// User approved — create the task
router.post('/approve', async (req, res) => {
  const { queue_id, user_id, final_data } = req.body;

  if (!queue_id || !user_id || !final_data) {
    return res.status(400).json({ error: 'queue_id, user_id and final_data required' });
  }

  // Get original queue item
  const { data: queueItem, error: queueError } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('id', queue_id)
    .single();

  if (queueError) return res.status(404).json({ error: 'Queue item not found' });

  // Create the task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id,
      title:            final_data.title,
      description:      final_data.description || null,
      due_date:         final_data.due_date     || null,
      due_time:         final_data.due_time     || null,
      priority:         final_data.priority     || 'medium',
      category:         final_data.category     || 'work',
      status:           'active',
      confidence_score: queueItem.confidence_score,
      metadata:         { source: 'nlp', input: queueItem.input_text }
    })
    .select()
    .single();

  if (taskError) return res.status(500).json({ error: taskError.message });

  // Calculate what user changed vs what AI extracted
  const corrections = {};
  const original = queueItem.extracted_data;
  
  // Use JSON.stringify for a quick deep comparison of values
  for (const key of Object.keys(final_data)) {
    if (JSON.stringify(original[key]) !== JSON.stringify(final_data[key])) {
      corrections[key] = { from: original[key], to: final_data[key] };
    }
  }

  // Save feedback for NLP improvement
  if (Object.keys(corrections).length > 0) {
    await supabase.from('nlp_feedback').insert({
      user_id,
      input_text:          queueItem.input_text,
      original_extraction: original,
      final_task:          final_data,
      corrections,
      confidence_before:   queueItem.confidence_score,
    });
  }

  // Mark queue item resolved
  await supabase
    .from('hitl_queue')
    .update({
      action:      Object.keys(corrections).length > 0 ? 'edited' : 'approved',
      final_data,
      task_id:     task.id,
      resolved_at: new Date().toISOString()
    })
    .eq('id', queue_id);

  res.json({ success: true, task, corrections });
});

// POST /api/hitl/reject
// User rejected — discard the extraction
router.post('/reject', async (req, res) => {
  const { queue_id, reason } = req.body;

  if (!queue_id) return res.status(400).json({ error: 'queue_id required' });

  const { error } = await supabase
    .from('hitl_queue')
    .update({
      action:      'rejected',
      resolved_at: new Date().toISOString(),
      metadata:    reason ? { reason } : null
    })
    .eq('id', queue_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Extraction rejected' });
});

// GET /api/hitl/pending/:user_id
// Get all pending items for batch review
router.get('/pending/:user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('user_id', req.params.user_id)
    .is('action', null)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, pending: data, count: data.length });
});

// GET /api/hitl/stats/:user_id
// NLP accuracy stats for settings screen
router.get('/stats/:user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('action, confidence_score')
    .eq('user_id', req.params.user_id)
    .not('action', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  const total     = data.length;
  const approved  = data.filter(i => i.action === 'approved').length;
  const edited    = data.filter(i => i.action === 'edited').length;
  const rejected  = data.filter(i => i.action === 'rejected').length;
  const avgConf   = total > 0
    ? Math.round(data.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / total)
    : 0;

  res.json({
    success: true,
    stats: {
      total,
      approved,
      edited,
      rejected,
      accuracy_rate:   total > 0 ? Math.round((approved / total) * 100) : 0,
      avg_confidence:  avgConf,
    }
  });
});

module.exports = router;
