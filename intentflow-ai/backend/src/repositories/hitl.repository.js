const supabase = require('../utils/supabaseClient');

async function createHITLEntry(entryData) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .insert(entryData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getPendingTasks(userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function findById(hitlId, userId) {
  const { data, error } = await supabase
    .from('hitl_queue')
    .select('*')
    .eq('id', hitlId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data; // returns null on PGRST116 single() miss
}

async function updateStatus(hitlId, userId, status, extractedTasksUpdate = null) {
  const updates = { status };
  if (extractedTasksUpdate) {
    updates.extracted_tasks = extractedTasksUpdate;
  }

  const { data, error } = await supabase
    .from('hitl_queue')
    .update(updates)
    .eq('id', hitlId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function logNlpFeedback(feedbackData) {
  const { error } = await supabase
    .from('nlp_feedback')
    .insert(feedbackData);
  
  if (error) console.warn('[NLP Feedback]', error.message);
  // non-blocking
}

module.exports = {
  createHITLEntry,
  getPendingTasks,
  findById,
  updateStatus,
  logNlpFeedback
};