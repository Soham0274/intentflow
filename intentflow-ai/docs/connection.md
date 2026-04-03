# Connection & Integration Architecture

> **Project:** Agentic To-Do List — HITL + NLP + n8n
> **Covers:** All service connections, auth flows, environment config, error handling, troubleshooting
> **Last Updated:** 2025

---

## Table of Contents

1. [Connection Map Overview](#1-connection-map-overview)
2. [Supabase Connection](#2-supabase-connection)
3. [n8n Connection](#3-n8n-connection)
4. [NLP / AI API Connection](#4-nlp--ai-api-connection)
5. [Authentication Flow](#5-authentication-flow)
6. [Real-Time Connection](#6-real-time-connection)
7. [Environment Configuration](#7-environment-configuration)
8. [Error Handling Across Services](#8-error-handling-across-services)
9. [Troubleshooting Guide](#9-troubleshooting-guide)

---

## 1. Connection Map Overview

```
                    ┌──────────────────────────────┐
                    │      Browser / PWA            │
                    │                               │
                    │  ┌────────────────────────┐   │
                    │  │   React Components      │   │
                    │  │   Zustand / TanStack Q  │   │
                    │  └──────────┬─────────────┘   │
                    └─────────────┼────────────────-─┘
                                  │
              ┌───────────────────┤
              │                   │
        (A) Supabase         (B) Next.js
        Browser SDK          API Routes
        (anon key)           (server-side)
              │                   │
              │              ┌────┴──────────────┐
              │              │                   │
              │         (C) Supabase        (D) n8n
              │         Service Role        Webhooks
              │         (server only)            │
              │                                  │
              │                            (E) NLP API
              │
        (F) Supabase
        Realtime Channel
        (WebSocket)
```

### Connection Summary

| ID | From | To | Protocol | Auth Method | Direction |
|---|---|---|---|---|---|
| A | Browser | Supabase | HTTPS | anon key + JWT | Bidirectional |
| B | Browser | Next.js API | HTTPS | Cookie (JWT) | Client → Server |
| C | Next.js API | Supabase | HTTPS | service_role key | Server → Supabase |
| D | Next.js API | n8n | HTTPS | shared secret header | Server → n8n |
| E | n8n / Next.js API | NLP API | HTTPS | Bearer token | Server → NLP |
| F | Browser | Supabase Realtime | WebSocket | anon key + JWT | Bidirectional |

---

## 2. Supabase Connection

### Two Client Types — Critical Distinction

```
Browser Client (A)                Server Client (C)
──────────────────────────────    ──────────────────────────────────
Uses: NEXT_PUBLIC_SUPABASE_URL    Uses: NEXT_PUBLIC_SUPABASE_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY     SUPABASE_SERVICE_ROLE_KEY
Auth: User JWT from cookie        Auth: Service role (bypasses RLS)
Use:  Client components           Use:  API Routes, Server Components
RLS:  Enforced                    RLS:  Bypassed — BE CAREFUL
```

### Browser Client Setup

```ts
// src/lib/supabase/client.ts
// SAFE to import in 'use client' components
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for use in hooks
import { useMemo } from 'react'
export function useSupabase() {
  return useMemo(() => createSupabaseBrowser(), [])
}
```

### Server Client Setup

```ts
// src/lib/supabase/server.ts
// SERVER-ONLY — never import in 'use client' components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// Admin client — only for scripts/migrations — NEVER in API routes handling user data
export function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

### Supabase Query Pattern

```ts
// Always destructure error and handle it
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)

if (error) {
  // Log internally, return safe message to client
  console.error('[Supabase] tasks fetch error:', error)
  return NextResponse.json(
    { error: 'Failed to fetch tasks' },
    { status: 500 }
  )
}
```

---

## 3. n8n Connection

### Connection Flow

```
Next.js API Route
      │
      │ POST (server-side only)
      │ Header: X-Webhook-Secret: <shared-secret>
      │ Body: { event, payload, timestamp }
      │
      ▼
n8n Webhook Node
      │
      ├── [If: event === 'task_created']
      │       └── Process task → check confidence → HITL or auto-proceed
      │
      ├── [If: event === 'hitl_approved']
      │       └── Execute deferred action
      │
      └── [If: event === 'task_completed']
              └── Trigger completion workflows
```

### n8n Client (Server-Only)

```ts
// src/lib/n8n/client.ts
// SERVER-ONLY — never import on client side

interface N8nTriggerPayload {
  event: 'task_created' | 'task_completed' | 'hitl_approved' | 'hitl_rejected'
  payload: {
    task_id?: string
    user_id: string
    hitl_id?: string
    [key: string]: unknown
  }
  timestamp: number
}

interface N8nTriggerResult {
  success: boolean
  execution_id?: string
  error?: string
}

export async function triggerWorkflow(
  data: Omit<N8nTriggerPayload, 'timestamp'>
): Promise<N8nTriggerResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const secret = process.env.N8N_WEBHOOK_SECRET

  if (!webhookUrl || !secret) {
    console.error('[n8n] Missing webhook configuration')
    return { success: false, error: 'Workflow service not configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': secret,
      },
      body: JSON.stringify({ ...data, timestamp: Date.now() }),
      signal: AbortSignal.timeout(10000),  // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[n8n] HTTP ${response.status}:`, errorText)
      return { success: false, error: `Workflow returned ${response.status}` }
    }

    const result = await response.json()
    return { success: true, execution_id: result.executionId }

  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { success: false, error: 'Workflow service timeout' }
    }
    console.error('[n8n] Trigger error:', error)
    return { success: false, error: 'Workflow service unavailable' }
  }
}
```

### n8n Callback → Supabase (n8n side)

```
n8n workflow completes
      │
      ▼
HTTP Request node (n8n)
POST https://your-supabase-project.supabase.co/rest/v1/hitl_queue
Headers:
  apikey: <supabase-service-role-key>    ← stored in n8n credentials
  Authorization: Bearer <service-role-key>
  Content-Type: application/json

Body:
{
  "task_id": "{{$json.task_id}}",
  "user_id": "{{$json.user_id}}",
  "action_type": "confirm_task_creation",
  "proposed_data": {{$json.task_data}},
  "ai_reasoning": "{{$json.reasoning}}",
  "confidence": {{$json.confidence}},
  "n8n_callback_url": "{{$webhookUrl}}/hitl-callback"
}
```

---

## 4. NLP / AI API Connection

### Connection (Server-Side Only)

```ts
// src/lib/nlp/client.ts
// SERVER-ONLY

const SYSTEM_PROMPT = `
You are a task extraction assistant. Given natural language input,
extract a structured task object. Respond ONLY with valid JSON.

Schema:
{
  "title": "string (required, concise action)",
  "description": "string (optional, more detail)",
  "due_date": "ISO 8601 string or null",
  "priority": "low | medium | high",
  "requires_hitl": boolean (true if confidence < 0.7 or input is ambiguous),
  "confidence": number (0.0 - 1.0),
  "intent": "create_task | update_task | query_tasks | unknown"
}
`.trim()

export async function parseTaskFromNL(input: string): Promise<NLPParseResult> {
  const response = await fetch(process.env.NLP_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NLP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input }
      ]
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`NLP API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  try {
    return JSON.parse(content) as NLPParseResult
  } catch {
    throw new Error('NLP API returned invalid JSON')
  }
}
```

### Streaming NLP to Client

```
Browser                    Next.js Edge Route             NLP API
  │                               │                          │
  │── POST /api/nlp/stream ──────>│                          │
  │   { input: "..." }            │── POST (streaming) ─────>│
  │                               │                          │
  │<── text/event-stream ─────────│<── ReadableStream ───────│
  │    data: {"token": "Sch"}     │   (proxied directly)     │
  │    data: {"token": "edu"}     │                          │
  │    data: {"done": true}       │                          │
```

---

## 5. Authentication Flow

### Complete Auth Lifecycle

```
─── Registration ──────────────────────────────────────────────

User submits email + password
        │
        ▼
POST /api/auth/register (or Supabase client direct)
        │
        ▼
supabase.auth.signUp() → Supabase creates user in auth.users
        │
        ├── Sends verification email (if email confirm enabled)
        │
        └── Returns session JWT
                │
                ▼
        @supabase/ssr sets httpOnly cookie
                │
                ▼
        Middleware reads cookie on next request
        Redirects to /tasks

─── Login ─────────────────────────────────────────────────────

User submits credentials
        │
        ▼
supabase.auth.signInWithPassword()
        │
        ▼
Supabase validates → returns { user, session }
        │
        ▼
JWT stored in httpOnly cookie (access_token + refresh_token)
        │
        ▼
All subsequent API route calls:
  1. Read cookie in middleware
  2. createSupabaseServer().auth.getUser() → validates JWT
  3. Returns user object for RLS

─── Token Refresh ─────────────────────────────────────────────

JWT expires (default: 1 hour)
        │
        ▼
@supabase/ssr middleware auto-detects expiry
        │
        ▼
supabase.auth.refreshSession() → uses refresh_token (30 days)
        │
        ▼
New access_token written to cookie
User sees no interruption

─── Logout ────────────────────────────────────────────────────

User clicks logout
        │
        ▼
supabase.auth.signOut()
        │
        ▼
Cookies cleared
Zustand stores reset
Redirect to /login
```

### Middleware Flow (Every Request)

```ts
// middleware.ts — simplified flow
export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  // This call refreshes the token if needed
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isProtected = request.nextUrl.pathname.startsWith('/(app)')
    || request.nextUrl.pathname.startsWith('/tasks')
    || request.nextUrl.pathname.startsWith('/review')

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/tasks', request.url))
  }

  return response
}
```

---

## 6. Real-Time Connection

### Supabase Realtime (WebSocket)

```ts
// hooks/useRealtimeSubscription.ts
'use client'
import { useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onData: (payload: unknown) => void
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onData,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        onData
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`)
        }
        if (status === 'CLOSED') {
          console.warn(`[Realtime] Channel closed: ${table}`)
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter])
}
```

### HITL Real-Time Usage

```tsx
// In HITLProvider
useRealtimeSubscription({
  table: 'hitl_queue',
  event: 'INSERT',
  filter: `user_id=eq.${user.id}`,
  onData: (payload) => {
    useHITLStore.getState().addPending(payload.new as HITLItem)
  }
})
```

### Task Real-Time Usage

```tsx
// In TasksPage or TaskList
useRealtimeSubscription({
  table: 'tasks',
  event: 'UPDATE',
  filter: `user_id=eq.${user.id}`,
  onData: (payload) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

---

## 7. Environment Configuration

### Complete Variable Reference

```bash
# ─────────────────────────────────────────────────────────
# PUBLIC — safe to expose to browser (NEXT_PUBLIC_ prefix)
# ─────────────────────────────────────────────────────────

NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─────────────────────────────────────────────────────────
# PRIVATE — server-only (NO NEXT_PUBLIC_ prefix)
# These MUST NEVER appear in client-side code or bundles
# ─────────────────────────────────────────────────────────

# Supabase admin (bypasses RLS — use with extreme care)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n workflow engine
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
N8N_WEBHOOK_SECRET=your-hmac-shared-secret-min-32-chars

# NLP / AI
NLP_API_URL=https://api.openai.com/v1/chat/completions
NLP_API_KEY=sk-proj-...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Local Development

```bash
# .env.local (gitignored — never commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

SUPABASE_SERVICE_ROLE_KEY=eyJ...
N8N_WEBHOOK_URL=https://your-n8n-tunnel.ngrok.io/webhook/...
N8N_WEBHOOK_SECRET=dev-secret-only
NLP_API_URL=https://api.openai.com/v1/chat/completions
NLP_API_KEY=sk-...
```

### Vercel Environment Setup

```
Project Settings → Environment Variables

For each variable:
- Production:  ✅ Enable
- Preview:     ✅ Enable (use staging Supabase project)
- Development: ✅ Enable (optional — use .env.local locally)
```

### Variable Access Safety Check

```ts
// Utility: validate required env vars at startup
// src/lib/env.ts

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

// Server-only env (call in API routes)
export const serverEnv = {
  supabaseServiceKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  n8nWebhookUrl:      () => requireEnv('N8N_WEBHOOK_URL'),
  n8nWebhookSecret:   () => requireEnv('N8N_WEBHOOK_SECRET'),
  nlpApiUrl:          () => requireEnv('NLP_API_URL'),
  nlpApiKey:          () => requireEnv('NLP_API_KEY'),
}
```

---

## 8. Error Handling Across Services

### Error Response Standard

```ts
// All API routes return this shape on error
interface APIError {
  error: string        // human-readable message (safe for client)
  code?: string        // machine-readable code (optional)
  details?: string     // dev-only details (never in production)
}
```

### Centralized API Route Error Handler

```ts
// src/lib/api/handler.ts
import { NextResponse } from 'next/server'

export function apiError(
  message: string,
  status: number = 500,
  code?: string
): NextResponse {
  console.error(`[API Error] ${status} — ${message}`)
  return NextResponse.json(
    { error: message, code },
    { status }
  )
}

// Usage in route handlers:
if (!user) return apiError('Unauthorized', 401, 'AUTH_REQUIRED')
if (!task)  return apiError('Task not found', 404, 'NOT_FOUND')
if (error)  return apiError('Database error', 500, 'DB_ERROR')
```

### Per-Service Error Handling

```ts
// Supabase errors
const { data, error } = await supabase.from('tasks').select()
if (error) {
  // error.code: Postgres error code (e.g., '23505' = unique violation)
  // error.message: PostgreSQL error message
  // error.hint: Suggested fix
  if (error.code === '23505') return apiError('Task already exists', 409)
  return apiError('Database error', 500)
}

// n8n errors (non-blocking — don't fail user request if workflow fails)
const workflowResult = await triggerWorkflow({ event: 'task_created', payload })
if (!workflowResult.success) {
  // Log but don't fail — workflow is enhancement, not critical path
  console.warn('[n8n] Non-critical workflow failure:', workflowResult.error)
}

// NLP errors (graceful degradation)
try {
  const parsed = await parseTaskFromNL(input)
  // ...use parsed result
} catch (error) {
  console.error('[NLP] Parse error:', error)
  // Fall back: create task with raw input as title
  return { title: input, requires_hitl: true, confidence: 0 }
}
```

### Client-Side Error Handling

```ts
// hooks/useTasks.ts — TanStack Query handles retries
const { data, error, isError } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
})

// NLP streaming error handling
async function parseInput(input: string) {
  try {
    const response = await fetch('/api/nlp/stream', { ... })
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }
    // ... read stream
  } catch (error) {
    setStreamError('AI processing failed. Please try again or type manually.')
    setStreaming(false)
  }
}
```

---

## 9. Troubleshooting Guide

### Supabase Issues

**Problem: `JWT expired` errors in production**
```
Cause: Token refresh not configured correctly with @supabase/ssr
Fix:   Ensure middleware calls supabase.auth.getUser() (not getSession())
       getUser() triggers token refresh; getSession() does not
```

**Problem: RLS blocking server-side queries**
```
Cause: Using browser client (anon key) in API routes
Fix:   Always use createSupabaseServer() in API routes and Server Components
       If you need to bypass RLS intentionally, use createSupabaseAdmin() 
       and document WHY explicitly
```

**Problem: Real-time subscription not receiving events**
```
Cause: Table not added to supabase_realtime publication
Fix:   ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
       Verify in Supabase Dashboard → Database → Replication
```

**Problem: `relation "public.tasks" does not exist`**
```
Cause: Running queries before running migrations
Fix:   Check Supabase SQL editor — run schema SQL from backend.md
       Verify you're connected to the correct project (check SUPABASE_URL)
```

---

### n8n Issues

**Problem: Webhook returns 404**
```
Cause: Webhook node not activated, or URL path changed
Fix:   In n8n: ensure workflow is Active (toggle in top right)
       Verify N8N_WEBHOOK_URL matches exactly the webhook node's URL
       Check for trailing slash differences
```

**Problem: Webhook secret rejected (401/403)**
```
Cause: Secret mismatch between Next.js env and n8n webhook config
Fix:   1. Check N8N_WEBHOOK_SECRET in Vercel env vars
       2. In n8n webhook node → Header Auth → verify secret matches
       3. Check for whitespace/newline in env var value
```

**Problem: n8n can't write back to Supabase**
```
Cause: Wrong API key or missing apikey header in n8n HTTP Request node
Fix:   In n8n HTTP node headers:
       apikey: <supabase-service-role-key>
       Authorization: Bearer <supabase-service-role-key>
       Content-Type: application/json
```

---

### NLP API Issues

**Problem: NLP returns non-JSON response**
```
Cause: Model including explanation text outside JSON
Fix:   Add to system prompt: "Respond ONLY with the JSON object. No preamble, 
       no explanation, no markdown code fences."
       Wrap parse in try/catch with fallback to raw input
```

**Problem: Streaming stops mid-response**
```
Cause: Edge function timeout (default 30s on Vercel hobby)
Fix:   Add export const maxDuration = 60 to streaming route
       Consider Vercel Pro for longer timeouts on complex NLP
```

**Problem: NLP API rate limit (429)**
```
Cause: Too many concurrent requests
Fix:   Add request queuing in the NLP hook
       Implement exponential backoff:
       if (response.status === 429) {
         await sleep(1000 * 2 ** attempt)
         // retry
       }
```

---

### Authentication Issues

**Problem: Users get logged out after page refresh**
```
Cause: Cookie not being set correctly (httpOnly requires server handling)
Fix:   Verify @supabase/ssr version is latest
       Check that middleware.ts is configured and matching all routes
       Verify cookie settings in createServerClient
```

**Problem: Protected routes not redirecting on auth**
```
Cause: middleware.ts matcher not including the route
Fix:   Update matcher in middleware.ts to include all protected paths:
       matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)']
```

**Problem: `Invalid JWT` after Firebase → Supabase migration**
```
Cause: Old Firebase tokens being sent to Supabase
Fix:   Clear all cookies and localStorage on the client
       Sign user out of Firebase before switching to Supabase
       Consider a forced re-login migration with email notification
```

---

### PWA / Connection Issues

**Problem: PWA not installing (no "Add to Home Screen" prompt)**
```
Cause: manifest.json not found, or HTTPS not configured
Fix:   1. Verify /public/manifest.json exists and is valid JSON
       2. Verify <link rel="manifest"> in app/layout.tsx
       3. Confirm site is served over HTTPS (Vercel does this automatically)
       4. Open Chrome DevTools → Application → Manifest → check for errors
```

**Problem: Service worker caching stale API responses**
```
Cause: Aggressive cache strategy set in next-pwa runtimeCaching
Fix:   Set handler to 'NetworkFirst' for API routes
       Or set networkTimeoutSeconds to force network attempt:
       { handler: 'NetworkFirst', options: { networkTimeoutSeconds: 10 } }
```

**Problem: Supabase Realtime disconnects frequently on mobile**
```
Cause: Mobile browsers aggressively suspend background WebSocket connections
Fix:   Implement reconnection logic:
       channel.subscribe((status) => {
         if (status === 'CLOSED') {
           setTimeout(() => channel.subscribe(), 2000)
         }
       })
```
