const supabase = require('../utils/supabaseClient');

async function findAllByUser(userId, filters = {}) {
  let query = supabase.from('tasks').select('*').eq('user_id', userId);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.due_before) query = query.lte('due_date', filters.due_before);
  if (filters.due_after) query = query.gte('due_date', filters.due_after);

  // Pagination defaults
  const limit = filters.limit ? parseInt(filters.limit, 10) : 50;
  const offset = filters.offset ? parseInt(filters.offset, 10) : 0;
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function findById(taskId, userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function create(taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(taskId, userId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function softDelete(taskId, userId) {
  // Since database doesn't have a 'deleted' status, we actually delete the record
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function bulkCreate(tasksArray) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksArray)
    .select();

  if (error) throw error;
  return data;
}

module.exports = {
  findAllByUser,
  findById,
  create,
  update,
  softDelete,
  bulkCreate
};