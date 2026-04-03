# Mobile & Web Folder Structure

> **Project:** Agentic To-Do List — HITL + NLP + n8n
> **Covers:** Current Expo Router structure + Target Next.js PWA structure
> **Convention:** File-based routing in both frameworks

---

## Table of Contents

1. [Current Expo Structure](#1-current-expo-structure)
2. [Target Next.js PWA Structure](#2-target-nextjs-pwa-structure)
3. [Directory Purpose Reference](#3-directory-purpose-reference)
4. [Naming Conventions](#4-naming-conventions)
5. [File Placement Examples](#5-file-placement-examples)
6. [Migration Mapping](#6-migration-mapping)

---

## 1. Current Expo Structure

```
your-expo-app/
│
├── app/                          # Expo Router — file-based routing root
│   ├── _layout.tsx               # Root layout (fonts, providers, theme)
│   ├── index.tsx                 # Entry redirect (→ /tasks or /login)
│   │
│   ├── (auth)/                   # Route group: unauthenticated screens
│   │   ├── _layout.tsx           # Auth layout (no bottom nav)
│   │   ├── login.tsx             # Login screen
│   │   └── register.tsx          # Register screen
│   │
│   └── (app)/                    # Route group: authenticated screens
│       ├── _layout.tsx           # App layout (tab bar, bottom nav)
│       │
│       ├── tasks/
│       │   ├── index.tsx         # Task list screen
│       │   └── [id].tsx          # Task detail screen (dynamic route)
│       │
│       ├── review/
│       │   └── index.tsx         # HITL approval queue screen
│       │
│       └── settings.tsx          # User settings screen
│
├── components/                   # Shared, reusable UI components
│   ├── ui/                       # Primitive components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   │
│   ├── tasks/                    # Task-specific components
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskForm.tsx
│   │   └── TaskStatusBadge.tsx
│   │
│   ├── hitl/                     # HITL-specific components
│   │   ├── HITLQueueItem.tsx
│   │   ├── HITLApprovalCard.tsx
│   │   └── HITLActionButtons.tsx
│   │
│   ├── nlp/                      # NLP input + response components
│   │   ├── NLPInput.tsx
│   │   ├── NLPStreamDisplay.tsx
│   │   └── NLPSuggestionChip.tsx
│   │
│   └── layout/                   # Layout/shell components
│       ├── AppHeader.tsx
│       ├── BottomTabBar.tsx
│       └── ScreenWrapper.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useTasks.ts               # Task CRUD + subscription
│   ├── useHITL.ts                # HITL queue real-time hook
│   ├── useNLP.ts                 # NLP parsing + streaming
│   ├── useAuth.ts                # Auth state + session
│   └── useWorkflow.ts            # n8n trigger hook
│
├── services/                     # External service integrations
│   ├── supabase/
│   │   ├── client.ts             # Supabase client init
│   │   ├── tasks.ts              # Task DB operations
│   │   ├── hitl.ts               # HITL DB operations
│   │   └── auth.ts               # Auth helpers
│   │
│   ├── firebase/
│   │   └── client.ts             # Firebase client (legacy — to be removed)
│   │
│   ├── n8n/
│   │   └── webhooks.ts           # n8n webhook trigger functions
│   │
│   └── nlp/
│       └── api.ts                # NLP API client
│
├── store/                        # Global state management
│   ├── taskStore.ts              # Zustand task store
│   ├── hitlStore.ts              # Zustand HITL store
│   ├── authStore.ts              # Zustand auth store
│   └── uiStore.ts                # UI state (modals, loading, etc.)
│
├── types/                        # TypeScript type definitions
│   ├── task.ts                   # Task, TaskStatus, TaskPriority
│   ├── hitl.ts                   # HITLItem, HITLAction
│   ├── nlp.ts                    # NLPResponse, ParsedIntent
│   ├── user.ts                   # User, UserProfile
│   └── api.ts                    # API response types
│
├── utils/                        # Pure utility functions
│   ├── dates.ts                  # Date formatting helpers
│   ├── strings.ts                # String manipulation
│   ├── validation.ts             # Zod schemas
│   └── constants.ts              # App-wide constants
│
├── assets/                       # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   └── onboarding/
│   └── fonts/
│       └── Inter/
│
├── constants/                    # App configuration constants
│   ├── colors.ts                 # Design system colors
│   ├── spacing.ts                # Spacing scale
│   └── routes.ts                 # Route path constants
│
├── app.json                      # Expo configuration
├── app.config.ts                 # Dynamic Expo config
├── babel.config.js               # Babel config
├── tsconfig.json                 # TypeScript config
├── package.json
└── .env                          # Environment variables
```

---

## 2. Target Next.js PWA Structure

```
your-nextjs-app/
│
├── src/
│   │
│   ├── app/                          # Next.js App Router root
│   │   ├── layout.tsx                # Root layout (providers, fonts, metadata)
│   │   ├── page.tsx                  # Root redirect → /tasks
│   │   ├── globals.css               # Global styles + Tailwind imports
│   │   │
│   │   ├── (auth)/                   # Route group: unauthenticated
│   │   │   ├── layout.tsx            # Auth layout (centered card)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── register/
│   │   │       └── page.tsx          # Register page
│   │   │
│   │   ├── (app)/                    # Route group: authenticated
│   │   │   ├── layout.tsx            # App shell (sidebar, bottom nav mobile)
│   │   │   │
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx          # Task list page
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Task detail page
│   │   │   │
│   │   │   ├── review/
│   │   │   │   └── page.tsx          # HITL review queue page
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx          # User settings page
│   │   │
│   │   └── api/                      # Next.js API routes (server-side)
│   │       │
│   │       ├── tasks/
│   │       │   ├── route.ts          # GET /api/tasks, POST /api/tasks
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET, PATCH, DELETE /api/tasks/:id
│   │       │
│   │       ├── workflow/
│   │       │   └── trigger/
│   │       │       └── route.ts      # POST — trigger n8n webhook
│   │       │
│   │       ├── nlp/
│   │       │   ├── parse/
│   │       │   │   └── route.ts      # POST — parse NL input to task
│   │       │   └── stream/
│   │       │       └── route.ts      # POST — streaming NLP (SSE)
│   │       │
│   │       └── hitl/
│   │           ├── queue/
│   │           │   └── route.ts      # GET — pending HITL items
│   │           └── [id]/
│   │               └── route.ts      # POST — approve/reject HITL item
│   │
│   ├── components/                   # React component library
│   │   │
│   │   ├── ui/                       # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskStatusBadge.tsx
│   │   │   └── TaskFilters.tsx
│   │   │
│   │   ├── hitl/
│   │   │   ├── HITLQueueItem.tsx
│   │   │   ├── HITLApprovalCard.tsx
│   │   │   ├── HITLActionButtons.tsx
│   │   │   └── HITLEmptyState.tsx
│   │   │
│   │   ├── nlp/
│   │   │   ├── NLPInput.tsx          # Natural language input bar
│   │   │   ├── NLPStreamDisplay.tsx  # Streaming token-by-token display
│   │   │   └── NLPSuggestionChips.tsx
│   │   │
│   │   └── layout/
│   │       ├── AppShell.tsx          # Main authenticated shell
│   │       ├── Sidebar.tsx           # Desktop sidebar nav
│   │       ├── BottomNav.tsx         # Mobile bottom navigation
│   │       ├── Header.tsx            # Top header bar
│   │       └── PageWrapper.tsx       # Page-level padding/max-width
│   │
│   ├── hooks/                        # Custom React hooks (portable from Expo)
│   │   ├── useTasks.ts
│   │   ├── useHITL.ts
│   │   ├── useNLP.ts
│   │   ├── useAuth.ts
│   │   ├── useWorkflow.ts
│   │   └── useRealtimeSubscription.ts  # Generic Supabase RT hook
│   │
│   ├── lib/                          # Library/service integrations
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client (@supabase/ssr)
│   │   │   ├── server.ts             # Server client (API routes, Server Components)
│   │   │   ├── middleware.ts         # Supabase middleware helper
│   │   │   └── queries/
│   │   │       ├── tasks.ts          # Task queries
│   │   │       └── hitl.ts           # HITL queries
│   │   │
│   │   ├── n8n/
│   │   │   └── client.ts             # n8n webhook client (server-only)
│   │   │
│   │   └── nlp/
│   │       └── client.ts             # NLP API client (server-only)
│   │
│   ├── store/                        # Zustand stores
│   │   ├── taskStore.ts
│   │   ├── hitlStore.ts
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                        # TypeScript types (portable from Expo)
│   │   ├── task.ts
│   │   ├── hitl.ts
│   │   ├── nlp.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── utils/                        # Pure utilities (portable from Expo)
│       ├── dates.ts
│       ├── strings.ts
│       ├── validation.ts
│       └── constants.ts
│
├── public/                           # Static assets (served at root)
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker (generated by next-pwa)
│   ├── icon-192.png                  # PWA icon
│   ├── icon-512.png                  # PWA icon
│   └── favicon.ico
│
├── middleware.ts                     # Next.js middleware (auth protection)
├── next.config.ts                    # Next.js + PWA configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
└── .env.local                        # Local environment variables
```

---

## 3. Directory Purpose Reference

| Directory | Framework | Purpose |
|---|---|---|
| `app/` | Expo | File-based routes — each file is a screen |
| `app/` | Next.js | File-based routes — each `page.tsx` is a route |
| `app/api/` | Next.js | Server-side API handlers (no Expo equivalent) |
| `components/ui/` | Both | Design system primitives |
| `components/[feature]/` | Both | Feature-scoped UI components |
| `hooks/` | Both | Reusable stateful logic |
| `services/` | Expo | External API clients |
| `lib/` | Next.js | External clients + server-only code |
| `store/` | Both | Zustand global state |
| `types/` | Both | TypeScript interfaces |
| `utils/` | Both | Pure helper functions |
| `public/` | Next.js | Static files + PWA assets |
| `assets/` | Expo | Images, fonts (bundled by Metro) |

---

## 4. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTasks.ts` |
| Utilities | camelCase | `formatDate.ts` |
| API routes | always `route.ts` | `app/api/tasks/route.ts` |
| Pages | always `page.tsx` | `app/tasks/page.tsx` |
| Layouts | always `layout.tsx` | `app/(app)/layout.tsx` |
| Stores | camelCase with Store suffix | `taskStore.ts` |
| Type files | camelCase noun | `task.ts`, `hitl.ts` |

### Components

```tsx
// ✅ Correct — named export, PascalCase, typed props
interface TaskCardProps {
  task: Task
  onApprove?: (id: string) => void
}

export function TaskCard({ task, onApprove }: TaskCardProps) {
  return (...)
}

// ❌ Avoid — default export, untyped
export default function Card(props: any) { ... }
```

### Environment Variables

```bash
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Private (server-only — never NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
NLP_API_URL=
NLP_API_KEY=
```

---

## 5. File Placement Examples

### Where does a new screen go?

```
User asks: "Add a 'Completed Tasks' archive page"
Answer:    src/app/(app)/tasks/archived/page.tsx
```

### Where does a new API endpoint go?

```
User asks: "Add an endpoint to bulk-complete tasks"
Answer:    src/app/api/tasks/bulk-complete/route.ts
```

### Where does a new reusable hook go?

```
User asks: "Add a hook for real-time task count badge"
Answer:    src/hooks/useTaskCount.ts
```

### Where does a new Supabase query go?

```
User asks: "Add a query to fetch overdue tasks"
Answer:    src/lib/supabase/queries/tasks.ts → export function getOverdueTasks()
```

### Where does a new Zustand store slice go?

```
User asks: "Add global notification state"
Answer:    src/store/notificationStore.ts
```

---

## 6. Migration Mapping

### Direct Ports (code reusable with minor edits)

| Expo File | Next.js File | Change Required |
|---|---|---|
| `hooks/useTasks.ts` | `hooks/useTasks.ts` | Update Supabase client import |
| `hooks/useHITL.ts` | `hooks/useHITL.ts` | Update Supabase client import |
| `store/taskStore.ts` | `store/taskStore.ts` | None — Zustand is framework-agnostic |
| `types/*.ts` | `types/*.ts` | None — pure TypeScript |
| `utils/*.ts` | `utils/*.ts` | None — pure functions |
| `services/n8n/webhooks.ts` | `lib/n8n/client.ts` | Move to server-only lib |

### Rewrites Required (UI layer)

| Expo File | Next.js File | Effort |
|---|---|---|
| `app/(app)/tasks/index.tsx` | `app/(app)/tasks/page.tsx` | Medium — RN → HTML |
| `app/(app)/review/index.tsx` | `app/(app)/review/page.tsx` | High — real-time + complex UI |
| `components/ui/*` | `components/ui/*` | High — full rewrite |
| `components/layout/*` | `components/layout/*` | Medium |
| `app/_layout.tsx` | `app/layout.tsx` | Low — mostly providers |

### New Files (no Expo equivalent)

| File | Purpose |
|---|---|
| `middleware.ts` | Auth route protection |
| `app/api/**` | All server-side logic |
| `public/manifest.json` | PWA install config |
| `lib/supabase/server.ts` | Server-side Supabase client |
