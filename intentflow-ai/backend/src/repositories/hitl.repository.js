const supabase = require('../utils/supabaseClient');

/**
 * HITL Repository - IntentFlow AI
 */

/**
 * Create a new HITL entry
 * entryData: { user_id, raw_input, extracted_tasks, status }
 */
async function createHITLEntry(entryData) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .insert({
      user_id: entryData.user_id,
      raw_input: entryData.raw_input,
      extracted_tasks: entryData.extracted_tasks,
      status: entryData.status || 'pending_review'
    })
    .select()
    .single();

  if (error) {
    console.error('[HITL Repository] createHITLEntry failed:', error.message);
    throw error;
  }
  return data;
}

/**
 * Get all pending HITL items for a user
 */
async function getPendingTasks(userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[HITL Repository] getPendingTasks failed:', error.message);
    throw error;
  }
  return data;
}

/**
 * Find a specific HITL entry by ID
 */
async function findById(hitlId, userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('id', hitlId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Update the status of a HITL entry (approved/rejected)
 */
async function updateStatus(hitlId, userId, status, updatedTasks = null) {
  const updates = { status };
  if (updatedTasks) {
    updates.extracted_tasks = updatedTasks;
  }

  const { data, error } = await supabase
    .from('hitl_queue')
    .update(updates)
    .eq('id', hitlId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[HITL Repository] updateStatus failed:', error.message);
    throw error;
  }
  return data;
}

/**
 * Log NLP Feedback for future training
 */
async function logNlpFeedback(feedbackData) {
  const { error } = await supabase
    .from('nlp_feedback')
    .insert(feedbackData);
  
  if (error) console.warn('[NLP Feedback Repository]', error.message);
}

module.exports = {
  createHITLEntry,
  getPendingTasks,
  findById,
  updateStatus,
  logNlpFeedback
};