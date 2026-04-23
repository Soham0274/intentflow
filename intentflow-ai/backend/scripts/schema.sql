-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
        id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title            TEXT NOT NULL,
        description      TEXT,
        status           TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN (
                             'pending','pending_review','in_progress',
                             'awaiting_hitl','completed','cancelled','deleted'
                           )),
        priority         TEXT NOT NULL DEFAULT 'medium'
                           CHECK (priority IN ('low','medium','high')),
        category         TEXT DEFAULT 'work'
                           CHECK (category IN ('work','personal','urgent','routine','health')),
        due_date         TIMESTAMPTZ,
        nlp_raw_input    TEXT,
        hitl_id          UUID,
        tags             TEXT[] DEFAULT '{}',
        workflow_id      TEXT,
        confidence_score INTEGER DEFAULT 50
                           CHECK (confidence_score BETWEEN 0 AND 100),
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );

-- Create hitl_queue table
CREATE TABLE IF NOT EXISTS public.hitl_queue (
        id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        raw_input         TEXT NOT NULL,
        extracted_tasks   JSONB DEFAULT '[]',
        status            TEXT NOT NULL DEFAULT 'pending_review'
                            CHECK (status IN ('pending_review','approved','rejected','expired')),
        n8n_callback_url  TEXT,
        ai_reasoning      TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
        id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name TEXT,
        avatar_url   TEXT,
        preferences  JSONB DEFAULT '{}',
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      );

-- Create nlp_feedback table
CREATE TABLE IF NOT EXISTS public.nlp_feedback (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        raw_input     TEXT,
        parsed_output JSONB,
        feedback      TEXT CHECK (feedback IN ('correct','incorrect','partial')),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

-- Create tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id    ON public.tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status     ON public.tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON public.tasks(due_date) WHERE due_date IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_tasks_hitl_id    ON public.tasks(hitl_id) WHERE hitl_id IS NOT NULL;

-- Create hitl_queue indexes
CREATE INDEX IF NOT EXISTS idx_hitl_user_status ON public.hitl_queue(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_hitl_created_at  ON public.hitl_queue(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

-- Attach updated_at trigger to tasks
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
      CREATE TRIGGER tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attach updated_at trigger to hitl_queue
DROP TRIGGER IF EXISTS hitl_updated_at ON public.hitl_queue;
      CREATE TRIGGER hitl_updated_at
        BEFORE UPDATE ON public.hitl_queue
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attach updated_at trigger to user_profiles
DROP TRIGGER IF EXISTS profiles_updated_at ON public.user_profiles;
      CREATE TRIGGER profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.tasks         ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.hitl_queue    ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.nlp_feedback  ENABLE ROW LEVEL SECURITY;

-- Create tasks RLS policy
DROP POLICY IF EXISTS "tasks_user_isolation" ON public.tasks;
      CREATE POLICY "tasks_user_isolation" ON public.tasks
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

-- Create hitl_queue RLS policy
DROP POLICY IF EXISTS "hitl_user_isolation" ON public.hitl_queue;
      CREATE POLICY "hitl_user_isolation" ON public.hitl_queue
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

-- Create user_profiles RLS policy
DROP POLICY IF EXISTS "profiles_user_isolation" ON public.user_profiles;
      CREATE POLICY "profiles_user_isolation" ON public.user_profiles
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

-- Create nlp_feedback RLS policy
DROP POLICY IF EXISTS "nlp_feedback_user_isolation" ON public.nlp_feedback;
      CREATE POLICY "nlp_feedback_user_isolation" ON public.nlp_feedback
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

-- Create auto-profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.user_profiles (id, display_name, avatar_url)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach auto-profile trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
