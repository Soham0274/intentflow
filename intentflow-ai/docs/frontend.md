# Frontend Architecture

> **Project:** Agentic To-Do List — HITL + NLP + n8n
> **Framework:** Next.js 14 (App Router) — Progressive Web App
> **Language:** TypeScript (strict mode)
> **Last Updated:** 2025

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Structure](#2-component-structure)
3. [Routing](#3-routing)
4. [State Management](#4-state-management)
5. [Styling Approach](#5-styling-approach)
6. [Data Fetching](#6-data-fetching)
7. [Key Features Implementation](#7-key-features-implementation)
8. [PWA Configuration](#8-pwa-configuration)
9. [Build Process](#9-build-process)
10. [Performance Optimizations](#10-performance-optimizations)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              Browser / PWA Shell                     │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │             App Router Layout Tree              │ │
│  │                                                 │ │
│  │  RootLayout (providers, fonts, theme)           │ │
│  │  └── (auth)/layout  OR  (app)/layout            │ │
│  │       └── page.tsx (Server Component)           │ │
│  │            └── Client Components (interactive)  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  State Layer:  Zustand (client) + TanStack Query     │
│  Real-time:    Supabase Channels                     │
│  Streaming:    SSE (NLP responses)                   │
└──────────────────────────────────────────────────────┘
```

### Server vs Client Component Strategy

```
Server Components (default)      Client Components ('use client')
───────────────────────────      ──────────────────────────────────
Page layouts                     Any component with useState/useEffect
Initial data fetching            NLP input (keyboard interactions)
Static UI shells                 HITL approval buttons
SEO metadata                     Real-time subscriptions
Auth verification                Zustand store consumers
```

**Rule of thumb:** Start every component as a Server Component. Add `'use client'` only when you need browser APIs, hooks, or interactivity.

---

## 2. Component Structure

### Component Hierarchy

```
AppShell (layout)
├── Header
│   ├── Logo
│   ├── NavigationLinks (desktop)
│   └── UserMenu
├── Sidebar (desktop only)
│   ├── NavItem × n
│   └── HITLBadge (real-time count)
├── BottomNav (mobile only)
│   └── NavItem × n
└── <page content>
    │
    ├── TasksPage
    │   ├── NLPInput             ← 'use client', streaming
    │   │   └── NLPStreamDisplay
    │   ├── TaskFilters          ← 'use client'
    │   └── TaskList
    │       └── TaskCard × n    ← 'use client' (interactions)
    │
    ├── TaskDetailPage
    │   ├── TaskHeader
    │   ├── TaskForm             ← 'use client'
    │   └── WorkflowStatus
    │
    └── HITLReviewPage
        ├── HITLEmptyState
        └── HITLQueueItem × n   ← 'use client', real-time
            ├── ProposedDataCard
            ├── AIReasoningCard
            └── HITLActionButtons
```

### Component Patterns

#### Presentational Component (no state)
```tsx
// components/tasks/TaskStatusBadge.tsx
import { clsx } from 'clsx'
import type { TaskStatus } from '@/types/task'

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending:       { label: 'Pending',    className: 'bg-gray-100 text-gray-700' },
  in_progress:   { label: 'In Progress',className: 'bg-blue-100 text-blue-700' },
  awaiting_hitl: { label: 'Needs Review',className: 'bg-yellow-100 text-yellow-700' },
  completed:     { label: 'Done',       className: 'bg-green-100 text-green-700' },
  cancelled:     { label: 'Cancelled',  className: 'bg-red-100 text-red-700' },
}

interface TaskStatusBadgeProps {
  status: TaskStatus
  size?: 'sm' | 'md'
}

export function TaskStatusBadge({ status, size = 'md' }: TaskStatusBadgeProps) {
  const { label, className } = statusConfig[status]
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      className
    )}>
      {label}
    </span>
  )
}
```

#### Container Component (fetches + passes data down)
```tsx
// app/(app)/tasks/page.tsx  — Server Component
import { createSupabaseServer } from '@/lib/supabase/server'
import { TaskList } from '@/components/tasks/TaskList'
import { NLPInput } from '@/components/nlp/NLPInput'

export default async function TasksPage() {
  const supabase = createSupabaseServer()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <NLPInput />            {/* Client Component */}
      <TaskList tasks={tasks ?? []} />  {/* Can be Server Component */}
    </div>
  )
}
```

---

## 3. Routing

### Route Map

```
/                        → Redirect to /tasks (authenticated) or /login
/login                   → Login page
/register                → Register page

/tasks                   → Task list (main view)
/tasks/[id]              → Task detail and edit

/review                  → HITL approval queue
/settings                → User settings and preferences
```

### Navigation Implementation

```tsx
// Client-side navigation
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// Programmatic navigation (replaces expo-router useRouter)
const router = useRouter()
router.push('/tasks/123')
router.replace('/login')
router.back()

// Link component (replaces expo-router Link)
<Link href="/tasks" prefetch={true}>Tasks</Link>

// Current path (replaces usePathname from expo-router)
const pathname = usePathname() // '/tasks'
```

### Route Protection (Middleware)

```ts
// middleware.ts — runs on every request at the edge
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-).*)',
  ],
}
```

---

## 4. State Management

### Architecture: Two Layers

```
┌─────────────────────────────────────────────────┐
│            TanStack Query (Server State)         │
│  - Task list, HITL queue, user profile           │
│  - Cache, background refetch, optimistic updates │
│  - Synced with Supabase via custom queryFn       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Zustand (Client State)              │
│  - UI state: modal open/close, selected task     │
│  - Real-time additions (from Supabase channels)  │
│  - NLP input/streaming state                     │
│  - Auth user object                              │
└─────────────────────────────────────────────────┘
```

### Zustand Stores

```ts
// store/taskStore.ts
import { create } from 'zustand'
import type { Task } from '@/types/task'

interface TaskStore {
  selectedTaskId: string | null
  isCreateModalOpen: boolean
  realtimeAdditions: Task[]      // tasks added via Supabase channel
  setSelectedTask: (id: string | null) => void
  openCreateModal: () => void
  closeCreateModal: () => void
  addRealtimeTask: (task: Task) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedTaskId: null,
  isCreateModalOpen: false,
  realtimeAdditions: [],
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  addRealtimeTask: (task) =>
    set((s) => ({ realtimeAdditions: [task, ...s.realtimeAdditions] })),
}))
```

```ts
// store/hitlStore.ts
import { create } from 'zustand'
import type { HITLItem } from '@/types/hitl'

interface HITLStore {
  pendingItems: HITLItem[]
  pendingCount: number
  addPending: (item: HITLItem) => void
  resolvePending: (id: string) => void
}

export const useHITLStore = create<HITLStore>((set, get) => ({
  pendingItems: [],
  pendingCount: 0,
  addPending: (item) => set((s) => ({
    pendingItems: [item, ...s.pendingItems],
    pendingCount: s.pendingCount + 1,
  })),
  resolvePending: (id) => set((s) => ({
    pendingItems: s.pendingItems.filter(i => i.id !== id),
    pendingCount: Math.max(0, s.pendingCount - 1),
  })),
}))
```

### TanStack Query Setup

```tsx
// app/layout.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,    // 1 minute
        refetchOnWindowFocus: true,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

```ts
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks')
      const { data } = await res.json()
      return data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

---

## 5. Styling Approach

### Tailwind CSS (Utility-First)

**Configuration:**
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
```

**Class composition pattern:**
```tsx
// Use clsx + tailwind-merge to avoid class conflicts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage:
<button className={cn(
  'px-4 py-2 rounded-lg font-medium transition-colors',
  variant === 'primary' && 'bg-brand-500 text-white hover:bg-brand-600',
  variant === 'ghost'   && 'bg-transparent hover:bg-gray-100',
  disabled && 'opacity-50 cursor-not-allowed',
  className  // allow prop override
)}>
```

### Responsive Design (Mobile-First)

```
Base styles      = mobile (PWA install target)
sm: (640px+)     = large phone / tablet
md: (768px+)     = tablet
lg: (1024px+)    = desktop (show sidebar, expand layouts)

Example:
<nav className="
  fixed bottom-0 w-full flex    ← mobile: bottom nav
  lg:static lg:flex-col lg:w-64 ← desktop: sidebar
">
```

---

## 6. Data Fetching

### Fetching Strategy by Context

| Context | Strategy | Example |
|---|---|---|
| Page initial load | Server Component fetch | `await supabase.from('tasks').select()` |
| Client interactions | TanStack Query + API routes | `useQuery(['tasks'], fetchTasks)` |
| Real-time updates | Supabase channels | `supabase.channel('hitl-queue').on(...)` |
| NLP streaming | SSE + ReadableStream | `fetch('/api/nlp/stream')` → stream reader |

### NLP Streaming Hook

```ts
// hooks/useNLP.ts
'use client'
import { useState } from 'react'

export function useNLPStream() {
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)

  async function parseInput(input: string) {
    setStreaming(true)
    setOutput('')
    setDone(false)

    const response = await fetch('/api/nlp/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { value, done: streamDone } = await reader.read()
      if (streamDone) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = JSON.parse(line.replace('data: ', ''))
        if (data.token) setOutput(prev => prev + data.token)
        if (data.done) { setDone(true); setStreaming(false) }
      }
    }
  }

  return { parseInput, streaming, output, done }
}
```

---

## 7. Key Features Implementation

### NLP Input Component

```tsx
// components/nlp/NLPInput.tsx
'use client'
import { useState } from 'react'
import { useNLPStream } from '@/hooks/useNLP'
import { NLPStreamDisplay } from './NLPStreamDisplay'

export function NLPInput() {
  const [input, setInput] = useState('')
  const { parseInput, streaming, output, done } = useNLPStream()

  return (
    <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="What do you need to do? e.g. 'remind me to submit report by Friday'"
          className="flex-1 resize-none rounded-lg border-0 p-2 text-sm focus:ring-0"
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              parseInput(input)
            }
          }}
        />
        <button
          onClick={() => parseInput(input)}
          disabled={streaming || !input.trim()}
          className="self-end rounded-lg bg-brand-500 px-4 py-2 text-sm text-white
                     disabled:opacity-50 hover:bg-brand-600 transition-colors"
        >
          {streaming ? 'Thinking...' : 'Add'}
        </button>
      </div>

      {(streaming || done) && (
        <NLPStreamDisplay output={output} done={done} />
      )}
    </div>
  )
}
```

### HITL Real-Time Subscription

```tsx
// components/hitl/HITLProvider.tsx
'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useHITLStore } from '@/store/hitlStore'
import { useAuth } from '@/hooks/useAuth'

export function HITLProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { addPending } = useHITLStore()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('hitl-queue')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hitl_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          addPending(payload.new as HITLItem)
          // Optional: show browser notification if PWA
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Action Required', {
              body: 'An AI action needs your review',
              icon: '/icon-192.png',
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return <>{children}</>
}
```

---

## 8. PWA Configuration

### next.config.ts

```ts
import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-cache', expiration: { maxEntries: 50 } },
    },
    {
      urlPattern: /\/api\/(tasks|hitl).*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 60 } },
    },
  ],
})

export default withPWAConfig({
  reactStrictMode: true,
  images: { domains: ['your-supabase-project.supabase.co'] },
})
```

### public/manifest.json

```json
{
  "name": "Agentic Tasks",
  "short_name": "Tasks",
  "description": "AI-powered task management with human-in-the-loop workflows",
  "start_url": "/tasks",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "categories": ["productivity", "utilities"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshot-mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

### iOS PWA Install Instructions (show in onboarding)

```
Safari → Share button (□↑) → "Add to Home Screen" → Add
```

---

## 9. Build Process

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src/",
    "test": "vitest"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## 10. Performance Optimizations

### Image Optimization

```tsx
// Always use next/image for automatic WebP + lazy loading
import Image from 'next/image'

<Image
  src="/avatar.png"
  alt="User avatar"
  width={40}
  height={40}
  className="rounded-full"
/>
```

### List Virtualization (large task lists)

```tsx
// For task lists > 100 items, use react-window
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  )}
</FixedSizeList>
```

### Key Performance Targets

| Metric | Target | How |
|---|---|---|
| LCP | < 2.5s | Server Components for initial data |
| FID / INP | < 100ms | Minimize client JS bundle |
| CLS | < 0.1 | Explicit dimensions on images/skeletons |
| PWA Lighthouse | > 90 | Manifest + service worker + HTTPS |
| Bundle size | < 200KB first load | Dynamic imports for heavy components |

### Dynamic Imports

```tsx
// Lazy-load heavy components
const HITLApprovalCard = dynamic(
  () => import('@/components/hitl/HITLApprovalCard'),
  { loading: () => <Skeleton />, ssr: false }
)
```
