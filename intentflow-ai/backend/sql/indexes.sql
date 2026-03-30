-- ═══════════════════════════════════════════════════════════════════════════
-- IntentFlow AI — Index Audit & Missing Indexes
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Check existing indexes ──────────────────────────────────────────
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ── STEP 2: Check columns that might need indexes ──────────────────────────
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('tasks', 'hitl_queue', 'users', 'projects', 'nlp_feedback', 'task_embeddings')
  AND n_distinct > 10
ORDER BY tablename, attname;

-- ── STEP 3: Create missing indexes ──────────────────────────────────────────

-- Tasks: most queried table
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Composite index for the most common query pattern: user's active tasks sorted by date
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_created 
  ON tasks(user_id, status, created_at DESC);

-- HITL queue: time-sensitive reads
CREATE INDEX IF NOT EXISTS idx_hitl_status_created 
  ON hitl_queue(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hitl_user_id ON hitl_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_hitl_user_pending 
  ON hitl_queue(user_id, created_at DESC) WHERE action IS NULL;

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- NLP Feedback
CREATE INDEX IF NOT EXISTS idx_nlp_feedback_user_id ON nlp_feedback(user_id);

-- ── STEP 4: Verify all indexes were created ─────────────────────────────────
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ── STEP 5: Run EXPLAIN ANALYZE on most frequent query ──────────────────────
-- Uncomment and replace 'test-user-id' with an actual user UUID

-- EXPLAIN ANALYZE
-- SELECT *
-- FROM tasks
-- WHERE user_id = 'test-user-id'
--   AND status != 'completed'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- Look for: "Index Scan" → good ✅
-- Look for: "Seq Scan"   → needs index ❌
