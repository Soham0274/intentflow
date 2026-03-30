/**
 * Task Service — IntentFlow AI
 * Business logic layer for task processing, HITL, and NLP integration
 * Routes should contain ZERO business logic — it all lives here
 */

const supabase = require('../config/supabase');
const { extractTaskIntent } = require('./nlp');
const { ApiError, NotFoundError } = require('../errors/ApiError');

// ─── NLP Processing ───────────────────────────────────────────────────────────

/**
 * Process natural language input through the NLP pipeline
 * Returns extracted data with confidence scoring
 */
async function processNLPInput(inputText) {
  if (!inputText || inputText.trim().length === 0) {
    throw new ApiError(400, 'Input text is required');
  }

  if (inputText.length > 500) {
    throw new ApiError(400, 'Input too long — max 500 characters');
  }

  const result = await extractTaskIntent(inputText.trim());

  if (!result.success) {
    throw new ApiError(422, 'NLP extraction failed: ' + result.error);
  }

  return result;
}

// ─── HITL Flow ────────────────────────────────────────────────────────────────

/**
 * Submit text for NLP extraction → create HITL queue entry
 * Auto-approves if confidence meets threshold
 */
async function submitToHITL(userId, inputText) {
  const nlpResult = await processNLPInput(inputText);

  // Save to hitl_queue
  const { data: queueItem, error } = await supabase
    .from('hitl_queue')
    .insert({
      user_id:          userId,
      input_text:       inputText,
      extracted_data:   nlpResult.data,
      confidence_score: nlpResult.confidence,
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Failed to create HITL queue entry: ' + error.message);

  // Auto-approve if confidence is high enough
  if (nlpResult.autoApprove) {
    const task = await createTaskFromData(userId, nlpResult.data, {
      confidence: nlpResult.confidence,
      source: 'nlp',
      input: inputText,
    });

    // Update queue record
    await supabase
      .from('hitl_queue')
      .update({
        action:      'approved',
        final_data:  nlpResult.data,
        task_id:     task.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', queueItem.id);

    return {
      autoApproved: true,
      task,
      queue_id:    queueItem.id,
      confidence:  nlpResult.confidence,
    };
  }

  // Return for manual review
  return {
    autoApproved:   false,
    queue_id:       queueItem.id,
    extracted_data: nlpResult.data,
    confidence:     nlpResult.confidence,
    message:        'Review required',
  };
}

/**
 * Approve a HITL queue item → create the task
 * Includes race condition guard: only processes items with action = null (pending)
 */
async function approveHITL(queueId, userId, finalData) {
  // Fetch original queue item
  const { data: queueItem, error: queueError } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (queueError || !queueItem) {
    throw new NotFoundError('Queue item');
  }

  // ── Race condition guard ──
  if (queueItem.action !== null) {
    throw new ApiError(409, `Queue item already resolved with action: ${queueItem.action}`);
  }

  // Verify ownership
  if (queueItem.user_id !== userId) {
    throw new ApiError(403, 'Not authorized to approve this item');
  }

  // Create the task
  const task = await createTaskFromData(userId, finalData, {
    confidence: queueItem.confidence_score,
    source: 'nlp',
    input: queueItem.input_text,
  });

  // Calculate corrections (what user changed vs AI extraction)
  const corrections = {};
  const original = queueItem.extracted_data;
  for (const key of Object.keys(finalData)) {
    if (JSON.stringify(original[key]) !== JSON.stringify(finalData[key])) {
      corrections[key] = { from: original[key], to: finalData[key] };
    }
  }

  // Save NLP feedback if user made corrections
  if (Object.keys(corrections).length > 0) {
    await supabase.from('nlp_feedback').insert({
      user_id:             userId,
      input_text:          queueItem.input_text,
      original_extraction: original,
      final_task:          finalData,
      corrections,
      confidence_before:   queueItem.confidence_score,
    });
  }

  // Mark queue item as resolved
  await supabase
    .from('hitl_queue')
    .update({
      action:      Object.keys(corrections).length > 0 ? 'edited' : 'approved',
      final_data:  finalData,
      task_id:     task.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', queueId);

  // Trigger n8n webhook if configured
  await triggerN8NWebhook('task_created', { task, source: 'hitl_approve' });

  return { task, corrections };
}

/**
 * Reject a HITL queue item
 */
async function rejectHITL(queueId, reason) {
  // Race condition guard
  const { data: queueItem, error: fetchError } = await supabase
    .from('hitl_queue')
    .select('action')
    .eq('id', queueId)
    .single();

  if (fetchError || !queueItem) {
    throw new NotFoundError('Queue item');
  }

  if (queueItem.action !== null) {
    throw new ApiError(409, `Queue item already resolved with action: ${queueItem.action}`);
  }

  const { error } = await supabase
    .from('hitl_queue')
    .update({
      action:      'rejected',
      resolved_at: new Date().toISOString(),
      final_data:  reason ? { reason } : null,
    })
    .eq('id', queueId);

  if (error) throw new ApiError(500, 'Failed to reject queue item: ' + error.message);

  return { message: 'Extraction rejected' };
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

/**
 * Create a task from structured data
 */
async function createTaskFromData(userId, taskData, meta = {}) {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id:          userId,
      title:            taskData.title,
      description:      taskData.description || null,
      due_date:         taskData.due_date || null,
      due_time:         taskData.due_time || null,
      priority:         taskData.priority || 'medium',
      category:         taskData.category || 'work',
      status:           'active',
      confidence_score: meta.confidence || null,
      metadata:         { source: meta.source || 'manual', input: meta.input || null },
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Failed to create task: ' + error.message);

  return task;
}

/**
 * Get all tasks for a user (non-completed)
 */
async function getUserTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(500, 'Failed to fetch tasks: ' + error.message);
  return data;
}

/**
 * Get a single task by ID
 */
async function getTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error || !data) throw new NotFoundError('Task');
  return data;
}

/**
 * Update a task
 */
async function updateTask(taskId, updates) {
  // Prevent modifying protected fields
  delete updates.id;
  delete updates.user_id;
  delete updates.created_at;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new ApiError(500, 'Failed to update task: ' + error.message);
  return data;
}

/**
 * Complete a task
 */
async function completeTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      status:       'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new ApiError(500, 'Failed to complete task: ' + error.message);

  // Trigger n8n webhook
  await triggerN8NWebhook('task_completed', { task: data });

  return data;
}

/**
 * Delete a task
 */
async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new ApiError(500, 'Failed to delete task: ' + error.message);
  return { message: 'Task deleted' };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Get HITL/NLP accuracy stats for a user
 */
async function getHITLStats(userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('action, confidence_score')
    .eq('user_id', userId)
    .not('action', 'is', null);

  if (error) throw new ApiError(500, 'Failed to fetch stats: ' + error.message);

  const total    = data.length;
  const approved = data.filter(i => i.action === 'approved').length;
  const edited   = data.filter(i => i.action === 'edited').length;
  const rejected = data.filter(i => i.action === 'rejected').length;
  const avgConf  = total > 0
    ? Math.round(data.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / total)
    : 0;

  return {
    total,
    approved,
    edited,
    rejected,
    accuracy_rate:  total > 0 ? Math.round((approved / total) * 100) : 0,
    avg_confidence: avgConf,
  };
}

/**
 * Get pending HITL items for a user
 */
async function getPendingHITL(userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('user_id', userId)
    .is('action', null)
    .order('created_at', { ascending: false });

  if (error) throw new ApiError(500, 'Failed to fetch pending items: ' + error.message);
  return data;
}

// ─── n8n Webhook Integration ──────────────────────────────────────────────────

/**
 * Trigger an n8n webhook (fire-and-forget)
 */
async function triggerN8NWebhook(event, payload) {
  const webhookUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.warn('[N8N] No webhook URL configured — skipping');
    return;
  }

  try {
    const response = await fetch(`${webhookUrl}/webhook/${event}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret && { 'X-Webhook-Secret': secret }),
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });

    if (!response.ok) {
      console.warn(`[N8N] Webhook ${event} returned ${response.status}`);
    } else {
      console.log(`[N8N] Webhook ${event} triggered successfully`);
    }
  } catch (err) {
    // Fire-and-forget — don't fail the main operation
    console.warn(`[N8N] Webhook ${event} failed:`, err.message);
  }
}

module.exports = {
  processNLPInput,
  submitToHITL,
  approveHITL,
  rejectHITL,
  createTaskFromData,
  getUserTasks,
  getTask,
  updateTask,
  completeTask,
  deleteTask,
  getHITLStats,
  getPendingHITL,
  triggerN8NWebhook,
};
