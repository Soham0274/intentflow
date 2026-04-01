const supabase = require('../utils/supabaseClient');

async function findAllByUser(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function findById(projectId, userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function create(projectData) {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(projectId, userId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function remove(projectId, userId) {
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTaskCounts(projectId) {
  const { data: tasks, error: countError } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId);

  if (countError) throw countError;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const dueDate = new Date(t.due_date);
    return dueDate < new Date();
  }).length;

  const { data, error } = await supabase
    .from('projects')
    .update({
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return { ...data, tasks: totalTasks, completed: completedTasks, overdue: overdueTasks };
}

module.exports = {
  findAllByUser,
  findById,
  create,
  update,
  remove,
  updateTaskCounts
};
