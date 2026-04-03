# Migration Guide: Expo → Next.js PWA

> **Project:** Agentic To-Do List with HITL, NLP, and n8n Workflows
> **Migration Type:** React Native (Expo Router) → Next.js 14 App Router (PWA)
> **Primary Author:** Engineering Team
> **Last Updated:** 2025
> **Status:** Pre-Migration Planning

---

## Table of Contents

1. [Current State Overview](#1-current-state-overview)
2. [Target State](#2-target-state)
3. [Pre-Migration Checklist](#3-pre-migration-checklist)
4. [Migration Phases](#4-migration-phases)
5. [Risk Assessment](#5-risk-assessment)
6. [Rollback Procedures](#6-rollback-procedures)
7. [Timeline](#7-timeline)
8. [Post-Migration Validation](#8-post-migration-validation)
9. [Dependencies](#9-dependencies)

---

## 1. Current State Overview

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile Framework | Expo (Managed Workflow) | SDK 50+ |
| Routing | Expo Router | v3 |
| Language | TypeScript | 5.x |
| Database | Supabase + Firebase | Latest |
| Workflow Engine | n8n (self-hosted or cloud) | Latest |
| AI/NLP | External NLP API / LLM | — |
| State Management | (Zustand / Context API) | — |

### Current Architecture Diagram

```
┌─────────────────────────────────────────┐
│           Expo Mobile App               │
│   (iOS + Android, Expo Router)          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Screens  │  │Components│            │
│  └────┬─────┘  └────┬─────┘            │
│       └──────┬───────┘                 │
│         ┌────▼─────┐                   │
│         │ Services │                   │
│         └────┬─────┘                   │
└──────────────┼──────────────────────────┘
               │
    ┌──────────┼──────────────┐
    │          │              │
┌───▼───┐ ┌───▼───┐    ┌─────▼──────┐
│Supabse│ │Firebase│   │  n8n Cloud │
│  DB   │ │  Auth  │   │  Webhooks  │
└───────┘ └────────┘   └─────┬──────┘
                             │
                      ┌──────▼──────┐
                      │  NLP / LLM  │
                      │    APIs     │
                      └─────────────┘
```

### Known Pain Points Being Solved

- React Native Web is inadequate for complex web UI requirements
- App Store distribution cycle too slow for rapid feature iteration
- HITL approval flows are better suited to web-based interfaces
- NLP streaming responses are difficult to implement cleanly in React Native
- Firebase + Supabase dual-database creates unnecessary complexity

---

## 2. Target State

### Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Web Framework | Next.js 14 (App Router) | SSR + SSG + API Routes |
| PWA Layer | `next-pwa` | Service worker, manifest, offline |
| Language | TypeScript 5.x | Strict mode |
| Database | Supabase only | Firebase sunset |
| Auth | Supabase Auth + `@supabase/ssr` | Server-side auth |
| Workflow Engine | n8n (unchanged) | Via Next.js API routes |
| AI/NLP | Server-side via API routes | No client credential exposure |
| Styling | Tailwind CSS | Utility-first |
| State | Zustand + TanStack Query | Client + server state |
| Deployment | Vercel | Edge-ready |

### Target Architecture Diagram

```
┌──────────────────────────────────────────────┐
│           Next.js 14 App (PWA)               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │           App Router (Pages)           │  │
│  │  /          /tasks      /review        │  │
│  │  /auth      /tasks/[id] /settings      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────┐   ┌──────────────────────┐ │
│  │  React       │   │   API Routes         │ │
│  │  Components  │   │  /api/workflow/      │ │
│  │  (Tailwind)  │   │  /api/nlp/           │ │
│  └──────┬───────┘   │  /api/tasks/         │ │
│         │           └──────────┬───────────┘ │
└─────────┼──────────────────────┼─────────────┘
          │                      │
    ┌─────▼──────┐        ┌──────▼──────────┐
    │  Supabase  │        │   n8n Webhooks  │
    │  (DB+Auth  │        │   (Workflows)   │
    │  +Realtime)│        └──────┬──────────┘
    └────────────┘               │
                          ┌──────▼──────┐
                          │  NLP / LLM  │
                          │    APIs     │
                          └─────────────┘
```

---

## 3. Pre-Migration Checklist

### Codebase Audit
- [ ] Export full list of Expo dependencies (`package.json`)
- [ ] Document every screen and its route path
- [ ] List all Supabase tables, views, and RLS policies
- [ ] List all Firebase collections currently in use
- [ ] Document all n8n webhook URLs and payload schemas
- [ ] Document all NLP API endpoints and auth methods
- [ ] List all environment variables in `.env`
- [ ] Identify any Expo-specific APIs in use (`expo-location`, `expo-notifications`, etc.)
- [ ] Audit all navigation patterns (stack, tab, modal, deep link)

### Infrastructure Preparation
- [ ] Create Vercel project and connect repository
- [ ] Set up environment variables in Vercel dashboard
- [ ] Verify Supabase project is on a paid plan (for production)
- [ ] Enable Supabase RLS on all tables
- [ ] Confirm n8n webhooks are accessible from public internet
- [ ] Set up custom domain and SSL

### Team Preparation
- [ ] All engineers have Node.js 18+ installed
- [ ] All engineers familiar with Next.js App Router concepts
- [ ] Tailwind CSS setup documented
- [ ] Git branching strategy agreed (suggest: `main` → production, `develop` → staging)

### Data Safety
- [ ] Full Supabase database backup taken
- [ ] Firebase data exported and archived
- [ ] All user data migration scripts written and tested in staging

---

## 4. Migration Phases

### Phase 1 — Project Scaffold (Days 1–2)

**Goal:** Working Next.js project with PWA configured and deployed to staging.

```bash
# 1. Bootstrap
npx create-next-app@latest your-app-web \
  --typescript --tailwind --app --src-dir

# 2. PWA
npm install next-pwa
npm install --save-dev @types/serviceworker

# 3. State & Data
npm install zustand @tanstack/react-query
npm install @supabase/supabase-js @supabase/ssr

# 4. UI Utilities
npm install clsx tailwind-merge lucide-react
```

**Deliverables:**
- Next.js app running locally
- PWA manifest and service worker configured
- Vercel deployment live on staging URL
- Supabase client connected (read a test query)

---

### Phase 2 — Auth Migration (Days 2–3)

**Goal:** Users can sign in via Supabase Auth with server-side session handling.

```
Expo (Firebase Auth)     →    Supabase Auth + @supabase/ssr
app/(auth)/login.tsx     →    app/(auth)/login/page.tsx
app/(auth)/register.tsx  →    app/(auth)/register/page.tsx
```

**Steps:**
1. Create Supabase Auth server client in `lib/supabase/server.ts`
2. Create Supabase Auth browser client in `lib/supabase/client.ts`
3. Implement middleware for protected routes (`middleware.ts`)
4. Migrate all auth flows: email/password, OAuth (if used), magic link
5. Test session persistence across page refreshes
6. Sunset Firebase Auth (after all users migrated)

**Firebase Auth → Supabase Migration Script:**
```ts
// scripts/migrate-firebase-users.ts
// Run once. Exports Firebase users → imports to Supabase via admin API.
// Trigger password reset emails for all migrated users.
```

---

### Phase 3 — Routing Migration (Day 3)

**Goal:** All Expo Router routes replicated in Next.js App Router.

```
Expo Router                    Next.js App Router
─────────────────────────────────────────────────
app/index.tsx              →   app/page.tsx
app/(auth)/login.tsx       →   app/(auth)/login/page.tsx
app/(auth)/register.tsx    →   app/(auth)/register/page.tsx
app/(app)/_layout.tsx      →   app/(app)/layout.tsx
app/(app)/tasks/index.tsx  →   app/(app)/tasks/page.tsx
app/(app)/tasks/[id].tsx   →   app/(app)/tasks/[id]/page.tsx
app/(app)/review/index.tsx →   app/(app)/review/page.tsx
app/(app)/settings.tsx     →   app/(app)/settings/page.tsx
```

**Key differences to handle:**
- Replace `useRouter` from `expo-router` with `next/navigation`
- Replace `<Link>` from `expo-router` with `next/link`
- Replace `useLocalSearchParams` with `useSearchParams` / `useParams`
- Replace `<Stack.Screen>` options with `export const metadata`

---

### Phase 4 — Backend & API Routes (Days 3–5)

**Goal:** All n8n triggers and NLP calls moved server-side.

```
app/api/
├── tasks/
│   ├── route.ts           # GET all, POST new
│   └── [id]/
│       └── route.ts       # GET, PATCH, DELETE by ID
├── workflow/
│   └── trigger/
│       └── route.ts       # Trigger n8n webhook
├── nlp/
│   ├── parse/route.ts     # Parse natural language input
│   └── stream/route.ts    # Stream NLP response (SSE)
└── hitl/
    ├── queue/route.ts     # Get pending HITL items
    └── approve/route.ts   # Approve / reject action
```

**Priority:** NLP streaming route (users feel this most).

```ts
// app/api/nlp/stream/route.ts
export const runtime = 'edge' // Use edge runtime for lowest latency

export async function POST(req: Request) {
  const { input, taskContext } = await req.json()

  const response = await fetch(process.env.NLP_API_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NLP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input, context: taskContext }),
  })

  // Stream response directly to client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

---

### Phase 5 — UI Component Migration (Days 4–9)

**Goal:** All screens rebuilt as React web components with Tailwind.

**Migration order (lowest → highest complexity):**
1. Shared primitives: `Button`, `Input`, `Card`, `Badge`, `Modal`
2. Layout: `AppShell`, `Sidebar`, `BottomNav` (mobile), `Header`
3. Auth screens: Login, Register
4. Task list screen + Task card component
5. Task detail / edit screen
6. NLP input component (with streaming display)
7. HITL review screen (most complex — real-time)
8. Settings screen

**Component conversion reference:**
```
React Native         →    Web (Tailwind)
───────────────────────────────────────────
<View>               →    <div>
<Text>               →    <p>, <span>, <h1-h6>
<TextInput>          →    <input>, <textarea>
<Pressable>          →    <button>
<FlatList>           →    <ul> + .map() + react-window (if virtualizing)
<ScrollView>         →    <div className="overflow-y-auto">
<Image> (RN)         →    <Image> (next/image)
<SafeAreaView>       →    <main> with padding-safe-area
StyleSheet.create()  →    Tailwind className strings
```

---

### Phase 6 — Real-Time & HITL (Days 8–10)

**Goal:** HITL queue updates in real-time, approvals trigger n8n immediately.

```ts
// Supabase real-time subscription pattern
const channel = supabase
  .channel('hitl-queue')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'hitl_queue',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Add to pending queue in Zustand store
    useHITLStore.getState().addPending(payload.new)
  })
  .subscribe()
```

---

### Phase 7 — PWA Hardening & Testing (Days 10–12)

**Goal:** App installable on iOS and Android with offline capability.

- [ ] Test "Add to Home Screen" on iOS Safari
- [ ] Test "Add to Home Screen" on Android Chrome
- [ ] Test offline mode (disable network, check cached routes load)
- [ ] Test push notifications (if implemented)
- [ ] Run Lighthouse PWA audit (score > 90)
- [ ] Test on low-end Android device
- [ ] Test on iPhone SE (small screen)

---

### Phase 8 — Firebase Sunset (Day 12–14)

**Goal:** Remove Firebase entirely.

- [ ] Confirm zero active Firebase Auth users (all migrated to Supabase)
- [ ] Confirm no Firestore reads/writes in production logs
- [ ] Remove `firebase` package from `package.json`
- [ ] Remove all Firebase config files and environment variables
- [ ] Delete Firebase project (or archive, depending on policy)
- [ ] Remove Firebase from billing

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Background location broken for existing users | High | Medium | Document clearly; offer browser location as fallback for foreground use |
| Firebase → Supabase auth migration drops users | Medium | High | Run migration script in staging first; send password reset to all users |
| n8n webhooks fail from new server-side callers | Low | High | Test all webhook endpoints with Postman before cutover |
| PWA install prompt not shown on iOS | Medium | Medium | Provide manual "Add to Home Screen" instructions in onboarding |
| NLP streaming breaks on slow connections | Medium | Medium | Implement retry logic + timeout handling in streaming route |
| Supabase RLS blocks server-side queries | Medium | Medium | Use service role key only in API routes, never client-side |
| SEO regression (if app had public pages) | Low | Low | Verify metadata exports on all public pages |

---

## 6. Rollback Procedures

### If migration fails before cutover (safe)
- Expo app is unchanged in production
- Stop work on Next.js branch
- No user impact

### If migration fails after cutover (critical)

**Step 1 — Immediate (< 5 minutes)**
```bash
# Revert Vercel deployment to previous build
vercel rollback [deployment-url]
```

**Step 2 — DNS (if custom domain switched)**
- Repoint DNS to old hosting
- TTL propagation: 5–60 minutes depending on TTL set

**Step 3 — Database**
- If Supabase schema was altered: run rollback migrations
- If Firebase was sunset prematurely: restore from export
- Never run destructive DB operations until PWA is stable for 2+ weeks

**Step 4 — Communicate**
- Notify users of temporary disruption
- Estimated restore time: 30–60 minutes for full rollback

---

## 7. Timeline

```
Week 1
──────────────────────────────────────────────────────
Mon   Tue   Wed   Thu   Fri
 │     │     │     │     │
 ▼     ▼     ▼     ▼     ▼
[Ph1] [Ph2] [Ph3] [Ph4─────] [Ph5─begin]

Week 2
──────────────────────────────────────────────────────
Mon   Tue   Wed   Thu   Fri
 │     │     │     │     │
 ▼     ▼     ▼     ▼     ▼
[Ph5─────────────] [Ph6] [Ph7]

Week 3 (buffer + launch)
──────────────────────────────────────────────────────
Mon   Tue   Wed
 │     │     │
 ▼     ▼     ▼
[Ph8] [QA]  [🚀 Launch]
```

**Total estimated duration: 12–15 working days**

---

## 8. Post-Migration Validation

### Functional Checklist
- [ ] User can register and log in
- [ ] User can create, edit, delete tasks
- [ ] NLP input parses natural language into task
- [ ] NLP streaming response displays progressively
- [ ] n8n workflow triggers on task creation
- [ ] HITL queue receives items in real-time
- [ ] HITL approval/rejection triggers correct n8n branch
- [ ] App installs on Android Chrome ("Add to Home Screen")
- [ ] App installs on iOS Safari ("Add to Home Screen")
- [ ] Offline mode shows cached task list

### Performance Checklist
- [ ] Lighthouse Performance score > 85
- [ ] Lighthouse PWA score > 90
- [ ] First Contentful Paint < 1.5s on 4G
- [ ] Time to Interactive < 3s on 4G
- [ ] No Supabase N+1 query patterns

### Security Checklist
- [ ] No API keys exposed in client-side bundle (`NEXT_PUBLIC_` only for safe keys)
- [ ] Supabase RLS enabled on all tables
- [ ] n8n webhook URLs not exposed to client
- [ ] NLP API key only in server environment
- [ ] Auth middleware protecting all `/app/*` routes
- [ ] HTTPS enforced (Vercel handles this automatically)

---

## 9. Dependencies

### External Services

| Service | Purpose | Owner | Migration Impact |
|---|---|---|---|
| Supabase | Database, Auth, Real-time | Engineering | Kept — SSR client updated |
| Firebase | Auth (legacy) | Engineering | **Sunset in Phase 8** |
| n8n | Workflow automation | Engineering | Unchanged — called via API routes |
| NLP/LLM API | Natural language processing | Engineering | Moved server-side |
| Vercel | Hosting | Engineering | New — replaces Expo/EAS |

### Package Dependencies

**Removed (Expo-specific):**
```
expo, expo-router, expo-location, expo-notifications,
react-native, react-native-web, @react-navigation/*
```

**Added (Next.js PWA):**
```
next, next-pwa, @supabase/ssr, @tanstack/react-query,
zustand, tailwind-merge, clsx, lucide-react
```

**Kept (framework-agnostic):**
```
typescript, zod, date-fns, @supabase/supabase-js
```
