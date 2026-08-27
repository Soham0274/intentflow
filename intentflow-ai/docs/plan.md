# IntentFlow AI — Next.js Web App Migration Plan

**Goal:** Build a full, production-grade web app on Next.js that reuses as much logic as possible from the existing Expo (React Native) codebase, without duplicating work already done for mobile.

**Guiding principle:** Reuse *logic*, rebuild *UI*. Business logic, types, API clients, and backend services are platform-agnostic and should be shared. Screens/components are not — React Native primitives (`View`, `Text`, `FlatList`) don't run in the browser, so those get rewritten in Next.js/Tailwind per the existing Section 2 design spec (Calm Intelligence design system).

---

## 1. What Gets Reused vs Rebuilt

| Layer | Reuse from Expo folder? | Action |
|---|---|---|
| Supabase client config | ✅ Yes | Copy as-is (env-var driven) |
| TypeScript types/interfaces (Task, User, HITL item, etc.) | ✅ Yes | Move to shared package, no changes |
| NLP service calls (`extractTaskIntent`) | ✅ Yes | Copy API client function, only the transport (fetch URL) changes |
| Zustand stores (task state, HITL queue state) | ✅ Mostly | Reusable if not tied to RN-only storage (swap MMKV → localStorage/cookies) |
| Confidence scoring logic | ✅ Yes | Pure JS/TS function, zero changes needed |
| Auth flow logic (Google OAuth via Supabase) | ✅ Partially | Same provider, different redirect handling (Next.js middleware vs Expo deep link) |
| Screens (Home, Capture, HITL Review, Task Detail, Calendar, Projects, Settings) | ❌ No | Rebuild in React + Tailwind per Section 2 spec |
| Navigation (Expo Router tabs) | ❌ No | Replaced by Next.js App Router file-based routing |
| Gestures (swipe to complete/delete) | ❌ No | Replace with hover actions / buttons, or optional drag lib |
| Native-only APIs (expo-location background tracking, expo-haptics, expo-notifications push) | ❌ No | Not applicable to web — see Section 6 |
| Voice input (expo-speech) | ⚠️ Partial | Replace with Web Speech API (browser-native), same UX intent |

**Rule of thumb:** If it's in `services/`, `lib/`, `utils/`, `types/`, or `stores/` (non-UI) → reusable. If it's in `app/(tabs)/`, `components/`, or anything importing `react-native` → rebuild.

---

## 2. Target Architecture

```
intentflow-ai/
├── apps/
│   ├── mobile/              ← existing Expo app, untouched
│   └── web/                 ← NEW Next.js app
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── callback/route.ts
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx        ← sidebar + top bar shell
│       │   │   ├── page.tsx          ← Today view
│       │   │   ├── upcoming/page.tsx
│       │   │   ├── projects/page.tsx
│       │   │   ├── focus/page.tsx
│       │   │   └── settings/page.tsx
│       │   ├── api/
│       │   │   ├── nlp/extract/route.ts
│       │   │   ├── tasks/route.ts
│       │   │   ├── tasks/[id]/route.ts
│       │   │   ├── hitl/submit/route.ts
│       │   │   ├── hitl/approve/route.ts
│       │   │   ├── hitl/reject/route.ts
│       │   │   └── notifications/send/route.ts
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── TaskCard.tsx
│       │   ├── HITLApprovalPanel.tsx
│       │   ├── NLPInputBar.tsx
│       │   ├── CommandCenterSidebar.tsx
│       │   └── ConfidenceGauge.tsx
│       ├── tailwind.config.ts       ← ports design tokens from Master Build Prompt Section 2.1
│       └── next.config.js
├── packages/
│   └── shared/                ← NEW — extracted from Expo folder
│       ├── types/             ← Task, User, HITLItem, ExtractedData
│       ├── services/
│       │   ├── nlp.ts         ← extractTaskIntent()
│       │   ├── hitl.ts        ← confidence scoring
│       │   └── supabase.ts    ← client init
│       └── stores/            ← Zustand stores (platform-agnostic slices)
└── package.json                ← npm/pnpm workspaces root
```

**Why a shared package, not copy-paste:** You already maintain 6+ docs describing the same NLP prompt and confidence formula in slightly different versions across guides. A single `packages/shared` used by both apps prevents the mobile and web NLP logic from drifting apart again.

---

## 3. Migration Steps (in order)

### Phase 0 — Workspace Setup
1. Convert repo root to a monorepo using **pnpm workspaces** (or npm workspaces — simpler, no new tool to learn)
2. Move existing Expo app into `apps/mobile/` (git mv, preserve history)
3. Create `packages/shared/` and extract:
   - All TypeScript interfaces/types
   - `services/nlp.ts`, `services/hitl.confidence.ts`
   - Supabase client factory (parameterize the storage adapter so mobile uses SecureStore/MMKV, web uses cookies)
4. Update Expo app's imports to pull from `@intentflow/shared` instead of local files — **confirms nothing broke** before web work starts

✅ Checkpoint: Expo app still builds and runs identically after the extraction.

### Phase 1 — Next.js Skeleton + Auth
1. `npx create-next-app@latest apps/web --typescript --tailwind --app`
2. Port design tokens from Master Build Prompt Section 2.1 into `tailwind.config.ts`
3. Set up Supabase Auth with Google OAuth (same Google Cloud OAuth client, just add the Next.js redirect URI: `https://your-app.vercel.app/auth/callback`)
4. Build `/login` page and `(auth)/callback/route.ts` handler
5. Add auth middleware to protect `(dashboard)` routes

✅ Checkpoint: Login with Google → lands on empty dashboard shell, session persists on refresh.

### Phase 2 — API Routes (backend parity)
Port each backend endpoint from your existing Node/Express or Next.js API spec (Section 5/6 of Master Build Prompt) into `app/api/`:
- `POST /api/nlp/extract` → uses `@intentflow/shared` NLP service
- `POST /api/tasks`, `GET /api/tasks`, `PATCH /api/tasks/[id]`
- `POST /api/hitl/submit`, `/approve`, `/reject`
- `POST /api/notifications/send`

Since the shared package already has the NLP call and confidence logic, these routes are mostly thin wrappers — validate input, call shared service, write to Supabase.

✅ Checkpoint: All endpoints testable via curl/Postman, matching the same request/response shapes as the mobile backend.

### Phase 3 — Command Center UI
Build in this order (each is a vertical slice):
1. **Sidebar + shell layout** (`CommandCenterSidebar.tsx`) — nav items, active states
2. **TaskCard** component — port visual spec from Section 2.3, Component 1
3. **Task list / grid view** — fetch from `/api/tasks`, render TaskCards
4. **NLPInputBar** — text input + submit → calls `/api/nlp/extract`
5. **HITLApprovalPanel** — right-drawer (desktop) version of the mobile bottom-sheet, same field-editing UX
6. **ConfidenceGauge** — animated arc, reused visual language from mobile

✅ Checkpoint: Full loop works in browser — type input → HITL panel appears → approve → task shows in list.

### Phase 4 — Voice Input (Web Speech API)
Replace `expo-speech` with the browser-native **Web Speech API** (`SpeechRecognition`). Same UX contract (mic button → transcription → feeds into NLP bar), different implementation — this is a drop-in for the *input source only*, everything downstream (NLP call, HITL panel) is unchanged.

### Phase 5 — Calendar, Projects, Focus Mode, Settings
Port remaining screens from the mobile screen architecture (Section 3.2) into their web equivalents — same data, different layout (e.g., calendar becomes a proper week-grid instead of a mobile scroll view).

### Phase 6 — APK Download Page (your original ask)
Since you're keeping the Expo mobile app, add a simple `/download` route in the Next.js app:
- Static page with "Download for Android" button linking to your EAS-built APK URL
- Optional: detect `navigator.userAgent` to show Android vs "join TestFlight" messaging vs "use the web app" for desktop/iOS visitors

This makes the Next.js deploy do double duty: full web app **and** the distribution page for the APK, addressing your original sideload plan without needing a separate Expo web export at all.

### Phase 7 — Deploy
- Deploy `apps/web` to **Vercel** (root directory set to `apps/web` in project settings, since it's a monorepo)
- Backend/API routes ship with it automatically (Next.js API routes run as Vercel serverless functions — no separate Railway backend needed unless you want long-running n8n-adjacent processes elsewhere)
- Point Supabase, OpenAI, and n8n webhook env vars at the same values already used by the mobile backend

✅ Checkpoint: Public URL live, full HITL loop works end-to-end in production.

---

## 4. What You Get vs the Expo-Web-Export Path

| | Expo Web Export | This Next.js Plan |
|---|---|---|
| Effort | Low | Medium-High |
| UI quality on web | Adequate (RN-web quirks) | Native web feel, matches your Section 2 design spec |
| SEO / landing page | Poor (CSR-only SPA) | Good (SSR/SSG where needed) |
| Code shared with mobile | ~100% (same components) | ~30-40% (types, services, stores — not UI) |
| Matches existing docs | Partial (docs assume Next.js API routes already) | Full — this *is* what your Implementation Guide already specs |
| APK download page | Would need separate handling | Included as one route (Phase 6) |

---

## 5. Effort Estimate

| Phase | Rough Time |
|---|---|
| 0 — Workspace + shared package extraction | 2-3 days |
| 1 — Next.js skeleton + auth | 2 days |
| 2 — API routes | 3-4 days |
| 3 — Command Center UI (core loop) | 5-7 days |
| 4 — Voice input | 1-2 days |
| 5 — Remaining screens | 5-7 days |
| 6 — APK download page | 0.5 day |
| 7 — Deploy | 0.5-1 day |
| **Total** | **~3-4 weeks** at steady solo pace |

This roughly matches Weeks 5-8 in your existing 12-week roadmap if you run it in parallel with (rather than instead of) mobile feature work — but realistically, treat it as its own dedicated sprint rather than squeezing it alongside mobile Phase 2/3.

---

## 6. Things That Won't Come From Expo (build fresh, web-only)

- Background geofencing / location tracking — not applicable to web, skip entirely (matches your own recommendation to skip geolocation in MVP anyway)
- Push notifications — web push is a different API (Notification API + service worker) if you want it later; not a Phase 1-7 requirement
- Native haptics — no web equivalent, drop silently
- Bottom-sheet capture flow — becomes the right-drawer/modal `HITLApprovalPanel` instead

---

## 7. Immediate Next Action

Start with **Phase 0** — before writing a single line of Next.js UI, extract `packages/shared` from the Expo app and confirm the mobile app still works against it. This de-risks everything downstream: if the shared logic breaks mobile, you find out in a day, not three weeks into the web build.
