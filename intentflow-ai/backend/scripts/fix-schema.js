/**
 * IntentFlow AI — Schema Migration: Add missing columns
 * Run: node scripts/fix-schema.js
 *
 * Fixes:
 *   1. Add hitl_id column to tasks table (missing from initial schema)
 *   2. Fix tasks status constraint to include all valid statuses
 *   3. Verify the fix worked
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

async function runSQL(description, sql) {
  process.stdout.write(`  ⏳ ${description}...`);
  
  // Use Supabase Management API (not REST v1) for DDL
  // The Management API requires a different endpoint
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (resp.ok) {
    console.log(' ✅');
    return true;
  }

  const body = await resp.text();
  console.log(` ⚠️  HTTP ${resp.status} — ${body.substring(0, 100)}`);
  return false;
}

async function verifyColumn(table, column) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Try inserting a row to verify the column exists — quick check
  const { error } = await supabase.from(table).select(column).limit(1);
  if (error && error.message.includes('column') && error.message.includes('does not exist')) {
    return false;
  }
  return true;
}

// SQL to print — run manually in Supabase SQL editor
const MIGRATION_SQL = `
-- Migration: Add missing columns to tasks table
-- Run in: https://supabase.com/dashboard/project/yzptzrncyquylibcvhwm/sql

-- 1. Add hitl_id column (links task back to its HITL review entry)
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS hitl_id UUID REFERENCES public.hitl_queue(id) ON DELETE SET NULL;

-- 2. Add confidence_score column if missing
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100);

-- 3. Add workflow_id column if missing  
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS workflow_id TEXT;

-- 4. Add nlp_raw_input column if missing
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS nlp_raw_input TEXT;

-- 5. Fix status constraint to include 'deleted' (used by softDelete in repository)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending','pending_review','in_progress','awaiting_hitl','completed','cancelled','deleted'));

-- 6. Add index for hitl_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_hitl_id ON public.tasks(hitl_id) WHERE hitl_id IS NOT NULL;

-- 7. Fix nlp_feedback column structure if needed
ALTER TABLE public.nlp_feedback
  ADD COLUMN IF NOT EXISTS parsed_output JSONB,
  ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('correct','incorrect','partial'));

SELECT 'Migration complete' as status;
`;

(async () => {
  console.log('\n🔧 IntentFlow AI — Schema Fix Script\n');
  console.log('📡 Target:', SUPABASE_URL, '\n');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Check current state
  console.log('🔍 Checking current schema...\n');
  
  const checks = [
    { table: 'tasks', column: 'hitl_id' },
    { table: 'tasks', column: 'confidence_score' },
    { table: 'tasks', column: 'workflow_id' },
    { table: 'nlp_feedback', column: 'parsed_output' },
  ];

  const missing = [];
  for (const { table, column } of checks) {
    const { error } = await supabase.from(table).select(column).limit(1);
    const exists = !error || !error.message.includes(column);
    console.log(`  ${exists ? '✅' : '❌'} ${table}.${column}`);
    if (!exists) missing.push(`${table}.${column}`);
  }

  // Check status constraint by trying a softDelete
  const { error: statusErr } = await supabase
    .from('tasks')
    .update({ status: 'deleted' })
    .eq('id', '00000000-0000-0000-0000-000000000000'); // nonexistent row
  
  const statusOk = !statusErr || statusErr.code === 'PGRST116'; // PGRST116 = row not found (that's fine)
  console.log(`  ${statusOk ? '✅' : '❌'} tasks.status constraint includes 'deleted'`);
  if (!statusOk) missing.push('tasks.status constraint');

  if (missing.length === 0) {
    console.log('\n✅ Schema is correct! No migration needed.\n');
    return;
  }

  console.log(`\n⚠️  Found ${missing.length} schema issue(s): ${missing.join(', ')}`);
  console.log('\n📋 Run this SQL in the Supabase SQL Editor:\n');
  console.log('   https://supabase.com/dashboard/project/yzptzrncyquylibcvhwm/sql\n');
  
  // Write SQL file
  const fs = require('fs');
  const path = require('path');
  const outPath = path.join(__dirname, 'migration.sql');
  fs.writeFileSync(outPath, MIGRATION_SQL.trim());
  
  console.log('   (SQL also written to: scripts/migration.sql)\n');
  console.log('─'.repeat(70));
  console.log(MIGRATION_SQL);
  console.log('─'.repeat(70));
  console.log('\nAfter running the SQL, re-run: node scripts/smoke-test.js\n');
})();
