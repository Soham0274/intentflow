-- Run this script in your Supabase SQL Editor

-- 1. Enable pgvector for semantic search (Phase 3)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oauth_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  push_token TEXT,
  notification_settings JSONB DEFAULT '{"quiet_hours":{"enabled":true,"start":"22:00","end":"07:00"}}',
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('work', 'personal', 'urgent', 'routine', 'health')),
  status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'active',
  confidence_score INTEGER,
  project_id UUID REFERENCES public.projects(id),
  blocked_by_task_id UUID REFERENCES public.tasks(id),
  calendar_event_id TEXT,
  metadata JSONB,
  last_notified_at TIMESTAMPTZ,
  last_reminded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HITL Queue table
CREATE TABLE public.hitl_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  input_text TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  final_data JSONB,
  confidence_score INTEGER,
  action TEXT CHECK (action IN ('approved', 'edited', 'rejected')),
  task_id UUID REFERENCES public.tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 6. NLP Feedback table
CREATE TABLE public.nlp_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  input_text TEXT NOT NULL,
  original_extraction JSONB,
  final_task JSONB,
  corrections JSONB,
  confidence_before INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Task Embeddings table (for semantic search)
CREATE TABLE public.task_embeddings (
  task_id UUID PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Performance Indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_hitl_user_status ON public.hitl_queue(user_id, action);

-- 9. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hitl_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nlp_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
CREATE POLICY "user_sees_own_profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_updates_own_profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_sees_own_tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_sees_own_hitl" ON public.hitl_queue FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_sees_own_projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_sees_own_feedback" ON public.nlp_feedback FOR ALL USING (auth.uid() = user_id);
