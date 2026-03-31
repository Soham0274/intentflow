/**
 * User Repository — IntentFlow AI
 * users / user_preferences tables
 */

const supabase = require('../utils/supabaseClient');

async function findById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function upsertPreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...preferences }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  findById,
  updateProfile,
  getPreferences,
  upsertPreferences,
};