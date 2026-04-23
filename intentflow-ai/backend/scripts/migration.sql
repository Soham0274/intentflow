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