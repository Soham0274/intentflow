-- ═══════════════════════════════════════════════════════════════════════════
-- IntentFlow AI — RLS Multi-Role Stress Test
-- Run this STEP BY STEP in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: Verify RLS is enabled on ALL tables ─────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: ALL tables should show rowsecurity = true
-- If any show false, run:
-- ALTER TABLE public.<tablename> ENABLE ROW LEVEL SECURITY;

-- ── STEP 2: List all RLS policies ──────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── STEP 3: Test as authenticated user accessing OWN data ──────────────────
-- Replace 'YOUR-USER-UUID' with an actual user ID from your users table

-- First, find a test user:
SELECT id, email, name FROM public.users LIMIT 5;

-- Then test (replace the UUID):
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claims = '{"sub": "YOUR-USER-UUID"}';
-- SELECT * FROM tasks;
-- -- Should return ONLY that user's tasks ✅

-- ── STEP 4: Test cross-user data access (should return EMPTY) ──────────────
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000000"}';
-- SELECT * FROM tasks;
-- -- Should return 0 rows (no other user's data visible) ✅

-- ── STEP 5: Test unauthenticated access (should FAIL) ──────────────────────
-- SET LOCAL role = 'anon';
-- SELECT * FROM tasks;
-- -- Should return error or 0 rows ✅

-- ── STEP 6: Verify service_role bypasses RLS ────────────────────────────────
-- The backend uses SUPABASE_SECRET_KEY (service role) which bypasses RLS
-- This is correct — the backend handles auth at the middleware level
-- Just verify your backend .env uses SUPABASE_SECRET_KEY, not SUPABASE_ANON_KEY

-- ── STEP 7: Check for missing policies ──────────────────────────────────────
-- task_embeddings table should also have RLS if it contains user data
-- But since it only references task_id (which is already RLS-protected), 
-- it inherits protection through the foreign key relationship.

-- If you want explicit RLS on embeddings too:
-- CREATE POLICY "user_sees_own_embeddings" ON public.task_embeddings
--   FOR ALL USING (
--     task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
--   );
