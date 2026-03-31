const supabase = require('../utils/supabaseClient');

async function createLog(logData) {
  const { data, error } = await supabase
    .from('automation_logs')
    .insert(logData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateLogStatus(executionId, status, result = null) {
  const updates = { status };
  if (result) updates.result = result;

  const { data, error } = await supabase
    .from('automation_logs')
    .update(updates)
    .eq('execution_id', executionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createLog,
  updateLogStatus
};