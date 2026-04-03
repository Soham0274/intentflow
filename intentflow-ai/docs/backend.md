# Backend & Database Architecture

> **Project:** Agentic To-Do List — HITL + NLP + n8n
> **Backend Stack:** Next.js API Routes + Supabase + n8n + NLP/LLM API
> **Database:** Supabase (PostgreSQL)
> **Last Updated:** 2025

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [API Routes Reference](#3-api-routes-reference)
4. [Database Schema](#4-database-schema)
5. [Data Models](#5-data-models)
6. [n8n Workflow Integration](#6-n8n-workflow-integration)
7. [NLP / AI Integration](#7-nlp--ai-integration)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Security Measures](#9-security-measures)
10. [Deployment](#10-deployment)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Client (Browser/PWA)                      │
│                   React + Zustand + TanStack Query           │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│                  Next.js Server (Vercel Edge)                │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────────────┐ │
│  │   App Router Pages  │    │       API Routes             │ │
│  │   (SSR/SSG)         │    │  /api/tasks/*                │ │
│  │                     │    │  /api/workflow/trigger       │ │
│  │  Server Components  │    │  /api/nlp/parse              │ │
│  │  fetch on server    │    │  /api/nlp/stream             │ │
│  └─────────────────────┘    │  /api/hitl/*                 │ │
│                             └──────────────┬───────────────┘ │
└──────────────────────────────────────────┬─┼────────────────┘
                                           │ │
              ┌────────────────────────────┘ │
              │                              │
┌─────────────▼───────────────┐  ┌───────────▼───────────────┐
│         Supabase            │  │          n8n              │
│                             │  │   (Workflow Engine)       │
│  ┌──────────┐ ┌──────────┐  │  │                           │
│  │PostgreSQL│ │  Auth    │  │  │  ┌─────────┐ ┌─────────┐  │
│  │  Tables  │ │  (JWT)   │  │  │  │ Webhook │ │  NLP    │  │
│  └──────────┘ └──────────┘  │  │  │ Trigger │ │ Nodes   │  │
│  ┌──────────┐ ┌──────────┐  │  │  └─────────┘ └─────────┘  │
│  │Realtime  │ │ Storage  │  │  │                           │
│  │(Channels)│ │ (Files)  │  │  └──────────────┬────────────┘
│  └──────────┘ └──────────┘  │                 │
└─────────────────────────────┘      ┌───────────▼────────────┐
                                     │      NLP / LLM API     │
                                     │  (OpenAI / Anthropic   │
                                     │   / Custom endpoint)   │
                                     └────────────────────────┘
```

---

## 2. Technology Stack

| Component | Technology | Reason |
|---|---|---|
| API Server | Next.js 14 API Routes | Co-located with frontend, edge-ready |
| Database | Supabase (PostgreSQL) | Real-time, auth, RLS, open-source |
| Auth | Supabase Auth | Built-in, JWT, SSR-compatible |
| Workflows | n8n | Visual HITL automation, self-hostable |
| AI/NLP | OpenAI / Anthropic / Custom | Natural language task parsing |
| Cache | Vercel Edge Cache + TanStack Query | Client + edge caching |
| Hosting | Vercel | Edge functions, automatic SSL |
| Monitoring | Vercel Analytics + Supabase Logs | Built-in observability |

---

## 3. API Routes Reference

### Tasks

```
GET    /api/tasks              List all tasks for authenticated user
POST   /api/tasks              Create a new task
GET    /api/tasks/:id          Get single task by ID
PATCH  /api/tasks/:id          Update task (partial update)
DELETE /api/tasks/:id          Delete task
```

**GET /api/tasks**
```ts
// Response
{
  data: Task[],
  count: number,
  error: null | string
}
```

**POST /api/tasks**
```ts
// Request body
{
  title: string           // required
  description?: string
  due_date?: string       // ISO 8601
  priority?: 'low' | 'medium' | 'high'
  nlp_raw_input?: string  // original NL text if created via NLP
}

// Response
{
  data: Task,
  error: null | string
}
```

**PATCH /api/tasks/:id**
```ts
// Request body (all fields optional)
{
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
}
```

---

### NLP

```
POST   /api/nlp/parse          Parse natural language → structured task
POST   /api/nlp/stream         Stream NLP response via SSE
```

**POST /api/nlp/parse**
```ts
// Request
{ input: string }

// Response
{
  parsed: {
    title: string
    description?: string
    due_date?: string
    priority?: 'low' | 'medium' | 'high'
    requires_hitl: boolean     // true if AI is uncertain
    confidence: number         // 0–1
    intent: string             // 'create_task' | 'update_task' | 'query_tasks'
  }
}
```

**POST /api/nlp/stream**
```ts
// Request
{ input: string, task_context?: Task }

// Response: text/event-stream (SSE)
// Each chunk:
data: {"token": "Scheduling", "done": false}
data: {"token": " your", "done": false}
data: {"token": " meeting", "done": false}
data: {"done": true, "full_response": "Scheduling your meeting for tomorrow at 9am."}
```

---

### Workflow (n8n)

```
POST   /api/workflow/trigger   Trigger n8n workflow with payload
```

**POST /api/workflow/trigger**
```ts
// Request
{
  workflow_id: string     // which n8n workflow
  event: string           // 'task_created' | 'task_completed' | 'hitl_approved'
  payload: {
    task_id: string
    user_id: string
    [key: string]: unknown
  }
}

// Response
{
  triggered: boolean
  execution_id?: string
  error?: string
}
```

---

### HITL (Human-in-the-Loop)

```
GET    /api/hitl/queue         Get pending HITL items for user
POST   /api/hitl/:id           Approve or reject a HITL item
```

**GET /api/hitl/queue**
```ts
// Response
{
  data: HITLItem[],
  pending_count: number
}
```

**POST /api/hitl/:id**
```ts
// Request
{
  action: 'approve' | 'reject'
  reason?: string             // optional rejection reason
  modified_data?: Partial<Task>  // if user edits before approving
}

// Response
{
  success: boolean
  next_step: string           // what n8n will do next
}
```

---

### API Route Implementation Pattern

```ts
// app/api/tasks/route.ts
import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createSupabaseServer()

  // Verify authenticated user server-side
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count: data.length })
}

export async function POST(req: Request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger n8n workflow (non-blocking)
  fetch('/api/workflow/trigger', {
    method: 'POST',
    body: JSON.stringify({
      event: 'task_created',
      payload: { task_id: data.id, user_id: user.id }
    })
  }).catch(console.error)

  return NextResponse.json({ data }, { status: 201 })
}
```

---

## 4. Database Schema

### Supabase PostgreSQL Tables

```sql
-- ─────────────────────────────────────────
-- USERS (managed by Supabase Auth)
-- Extended profile in user_profiles
-- ─────────────────────────────────────────

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  preferences   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'awaiting_hitl',
  'completed',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status DEFAULT 'pending',
  priority        task_priority DEFAULT 'medium',
  due_date        TIMESTAMPTZ,
  nlp_raw_input   TEXT,          -- original natural language input
  nlp_parsed_data JSONB,         -- structured data from NLP parse
  workflow_id     TEXT,          -- associated n8n workflow execution ID
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ─────────────────────────────────────────
-- HITL QUEUE
-- ─────────────────────────────────────────

CREATE TYPE hitl_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE hitl_action_type AS ENUM (
  'confirm_task_creation',
  'confirm_task_update',
  'confirm_workflow_action',
  'review_nlp_result'
);

CREATE TABLE hitl_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type     hitl_action_type NOT NULL,
  status          hitl_status DEFAULT 'pending',
  proposed_data   JSONB NOT NULL,   -- what AI wants to do
  final_data      JSONB,            -- what user approved (may differ)
  ai_reasoning    TEXT,             -- why AI flagged for HITL
  confidence      FLOAT,            -- AI confidence score (0-1)
  user_reason     TEXT,             -- user's rejection reason
  n8n_callback_url TEXT,            -- webhook to call after resolution
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hitl_user_pending ON hitl_queue(user_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_hitl_task_id ON hitl_queue(task_id);

-- ─────────────────────────────────────────
-- NLP HISTORY
-- ─────────────────────────────────────────

CREATE TABLE nlp_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  raw_input       TEXT NOT NULL,
  parsed_output   JSONB NOT NULL,
  model_used      TEXT,
  confidence      FLOAT,
  required_hitl   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- WORKFLOW EXECUTIONS
-- ─────────────────────────────────────────

CREATE TYPE workflow_status AS ENUM (
  'triggered', 'running', 'completed', 'failed', 'waiting_hitl'
);

CREATE TABLE workflow_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  n8n_execution_id TEXT,           -- n8n's internal execution ID
  workflow_name   TEXT NOT NULL,
  status          workflow_status DEFAULT 'triggered',
  trigger_event   TEXT NOT NULL,
  input_payload   JSONB,
  output_payload  JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

---

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Tasks: users can only see their own
CREATE POLICY "tasks_owner_policy" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- HITL: users can only see their own
CREATE POLICY "hitl_owner_policy" ON hitl_queue
  FOR ALL USING (auth.uid() = user_id);

-- NLP history: users can only see their own
CREATE POLICY "nlp_history_owner_policy" ON nlp_history
  FOR ALL USING (auth.uid() = user_id);

-- Workflow executions: users can only see their own
CREATE POLICY "workflow_owner_policy" ON workflow_executions
  FOR ALL USING (auth.uid() = user_id);
```

---

### Real-Time Channels

```sql
-- Enable real-time for HITL queue (instant approval prompts)
ALTER PUBLICATION supabase_realtime ADD TABLE hitl_queue;

-- Enable real-time for tasks (live task list updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
```

---

## 5. Data Models

### TypeScript Types

```ts
// types/task.ts
export type TaskStatus = 'pending' | 'in_progress' | 'awaiting_hitl' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null       // ISO 8601
  nlp_raw_input: string | null
  nlp_parsed_data: NLPParseResult | null
  workflow_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

// types/hitl.ts
export type HITLStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type HITLActionType =
  | 'confirm_task_creation'
  | 'confirm_task_update'
  | 'confirm_workflow_action'
  | 'review_nlp_result'

export interface HITLItem {
  id: string
  task_id: string | null
  user_id: string
  action_type: HITLActionType
  status: HITLStatus
  proposed_data: Partial<Task>
  final_data: Partial<Task> | null
  ai_reasoning: string | null
  confidence: number | null
  expires_at: string
  created_at: string
}

// types/nlp.ts
export interface NLPParseResult {
  title: string
  description?: string
  due_date?: string
  priority?: TaskPriority
  requires_hitl: boolean
  confidence: number
  intent: 'create_task' | 'update_task' | 'query_tasks' | 'unknown'
}
```

---

## 6. n8n Workflow Integration

### Workflow Architecture

```
User Action (Next.js)
       │
       ▼
POST /api/workflow/trigger
       │
       ▼
n8n Webhook (authenticated)
       │
       ├──→ [Task Created Workflow]
       │         │
       │         ├──→ Enrich task with AI context
       │         ├──→ Check if HITL required
       │         ├──→ If HITL: INSERT into hitl_queue → notify user
       │         └──→ If no HITL: mark task as in_progress
       │
       └──→ [HITL Resolved Workflow]
                 │
                 ├──→ If approved: execute original action
                 └──→ If rejected: notify user, log reason
```

### n8n Webhook Security

```ts
// lib/n8n/client.ts
// SERVER-ONLY — never import in client components

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET!

export async function triggerN8nWorkflow(
  event: string,
  payload: Record<string, unknown>
): Promise<{ execution_id: string } | null> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': N8N_WEBHOOK_SECRET,  // HMAC or shared secret
      },
      body: JSON.stringify({ event, payload, timestamp: Date.now() }),
    })

    if (!response.ok) {
      console.error('n8n trigger failed:', response.status)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('n8n trigger error:', error)
    return null
  }
}
```

---

## 7. NLP / AI Integration

### Parse Flow

```
User types: "remind me to submit the report by friday afternoon"
                     │
                     ▼
          POST /api/nlp/parse
                     │
                     ▼
         NLP API (OpenAI / Anthropic)
         System prompt: task extraction
                     │
                     ▼
         {
           title: "Submit the report",
           due_date: "2025-01-10T14:00:00Z",
           priority: "medium",
           requires_hitl: false,
           confidence: 0.92
         }
                     │
              confidence < 0.7?
              ┌───────┴────────┐
             YES               NO
              │                │
     INSERT hitl_queue    INSERT tasks
     (user reviews)       (auto-create)
```

### Streaming Implementation

```ts
// app/api/nlp/stream/route.ts
export const runtime = 'edge'

export async function POST(req: Request) {
  const { input } = await req.json()

  const upstream = await fetch(process.env.NLP_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NLP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: TASK_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: input }
      ]
    }),
  })

  // Proxy the stream directly to client
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
```

---

## 8. Authentication & Authorization

### Auth Flow

```
1. User submits credentials (email/password or OAuth)
2. Supabase Auth validates and returns JWT
3. JWT stored in httpOnly cookie (handled by @supabase/ssr)
4. Next.js middleware reads cookie on every request
5. Protected routes return 401 if cookie missing/invalid
6. API routes verify user server-side before DB access
```

### Middleware Protection

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && request.nextUrl.pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 9. Security Measures

| Threat | Mitigation |
|---|---|
| Unauthorized DB access | Supabase RLS on every table |
| Credential exposure | Server-only env vars for all secrets |
| CSRF attacks | Supabase JWT + SameSite cookie |
| n8n webhook spoofing | Shared secret header verification |
| SQL injection | Supabase JS client uses parameterized queries |
| XSS | React's JSX escaping + CSP headers |
| Auth bypass | Server-side user verification in every API route |
| HITL queue tampering | User ID filter + RLS on hitl_queue |

### Content Security Policy (next.config.ts)

```ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]
```

---

## 10. Deployment

### Environment Variables (Vercel)

```bash
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase (private — server only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# n8n
N8N_WEBHOOK_URL=https://your-n8n.domain.com/webhook/xxxx
N8N_WEBHOOK_SECRET=your-shared-secret

# NLP
NLP_API_URL=https://api.openai.com/v1/chat/completions
NLP_API_KEY=sk-...
```

### Vercel Project Settings

```
Framework Preset:     Next.js
Node.js Version:      20.x
Build Command:        next build
Output Directory:     .next
Install Command:      npm install
Root Directory:       ./  (or /apps/web if monorepo)
```
