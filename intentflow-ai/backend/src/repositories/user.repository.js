/**
 * User Repository — IntentFlow AI
 * users / user_preferences tables
 */

const supabase = require('../utils/supabaseClient');

async function findOrCreate(userId, userData) {
  // 0. Extract and normalize email
  const email = (userData.email || userData.user_metadata?.email || '').toLowerCase().trim();
  
  if (!email) {
    console.error('[User Repository] findOrCreate failed: No email found in user object', userData);
    throw new Error('User email is required but was not found in Auth session.');
  }

  // 1. Try to find existing user by id
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    throw findError;
  }

  // 2. If id exists, update and return
  if (existing) {
    const { data: updated, error } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  // 3. Try to find by email if ID lookup failed (prevents unique constraint crash)
  const { data: byEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle(); // maybeSingle doesn't throw on 0 results, unlike single()
  
  if (byEmail) {
    console.warn(`[User Repository] AUTH/DB ID MISMATCH for ${email}. Auth ID: ${userId}, Existing DB ID: ${byEmail.id}. Using DB record.`);
    return byEmail;
  }

  // 4. User doesn't exist by id OR email — insert fresh
  console.log(`[User Repository] Creating new record for ${email} with ID ${userId}`);
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') { // Duplicate email catch-all retry
       const { data: retryData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
       if (retryData) return retryData;
    }
    console.error('[User Repository] insert failed:', insertError.message);
    throw insertError;
  }
  return created;
}

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
  findOrCreate,
  findById,
  updateProfile,
  getPreferences,
  upsertPreferences,
};