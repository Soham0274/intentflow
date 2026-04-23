const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:IntentFlow2026!@db.yzptzrncyquylibcvhwm.supabase.co:5432/postgres' });
async function main() {
  try {
    await client.connect();
    // 1. Check current status constraint logic
    let res = await client.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE contype = 'c' AND conrelid = 'public.tasks'::regclass;");
    console.log("Constraints:", res.rows);
    
    // 2. Add updated_at
    await client.query("ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;");
    await client.query("UPDATE public.tasks SET updated_at = created_at WHERE updated_at IS NULL;");
    console.log("Added updated_at column to tasks.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    client.end();
  }
}
main();
