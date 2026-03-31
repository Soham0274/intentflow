# IntentFlow AI — Backend Folder Structure

> Stack: Node.js + Express · Supabase (PostgreSQL + Auth) · Google Gemini · n8n (local + ngrok)  
> Hosted on: Railway (backend) · Local (n8n via ngrok tunnel)

---

## Root Structure

```
intentflow-backend/
├── src/
│   ├── api/                        # All route handlers (controllers)
│   ├── services/                   # Business logic layer
│   ├── repositories/               # Data access layer (Supabase)
│   ├── middleware/                  # Express middleware
│   ├── utils/                      # Shared helpers & utilities
│   ├── config/                     # App & env config
│   ├── types/                      # Shared TypeScript types / JSDoc
│   └── app.js                      # Express app setup
├── .env                            # Local env vars (never commit)
├── .env.example                    # Env template (commit this)
├── package.json
├── railway.json                    # Railway deployment config
└── README.md
```

---

## `/src/api/` — Full Route Map

```
src/api/
│
├── index.js                        # Mounts all routers onto Express app
│
├── nlp/
│   ├── extract.js                  # POST /api/nlp/extract
│   │                               #   → Accepts raw text, returns structured tasks via Gemini
│   ├── parse.js                    # POST /api/nlp/parse
│   │                               #   → Lightweight intent classification (action/priority/due)
│   └── validate.js                 # POST /api/nlp/validate
│                                   #   → Re-validates an edited task object before HITL confirm
│
├── tasks/
│   ├── index.js                    # GET  /api/tasks          → List all tasks for user
│   ├── create.js                   # POST /api/tasks          → Create task(s) (post-HITL)
│   ├── [id].js                     # GET  /api/tasks/:id      → Single task
│   │                               # PUT  /api/tasks/:id      → Full update
│   │                               # PATCH /api/tasks/:id     → Partial update (status, etc.)
│   │                               # DELETE /api/tasks/:id    → Soft delete
│   └── bulk.js                     # POST /api/tasks/bulk     → Batch create after multi-task NLP
│
├── hitl/
│   ├── pending.js                  # GET  /api/hitl/pending   → Fetch all awaiting-confirmation tasks
│   ├── confirm.js                  # POST /api/hitl/confirm   → User approves extracted task
│   ├── reject.js                   # POST /api/hitl/reject    → User rejects / discards task
│   └── edit.js                     # PATCH /api/hitl/edit/:id → User edits before confirming
│
├── automation/
│   ├── trigger.js                  # POST /api/automation/trigger
│   │                               #   → Manually trigger an n8n workflow by name/id
│   ├── webhook.js                  # POST /api/automation/webhook
│   │                               #   → Receives callbacks FROM n8n after workflow execution
│   ├── status.js                   # GET  /api/automation/status/:executionId
│   │                               #   → Poll n8n execution status
│   └── workflows.js                # GET  /api/automation/workflows
│                                   #   → List all available n8n workflows (for UI display)
│
├── auth/
│   ├── me.js                       # GET  /api/auth/me        → Return current user profile
│   ├── refresh.js                  # POST /api/auth/refresh   → Refresh Supabase session token
│   └── logout.js                   # POST /api/auth/logout    → Invalidate session
│
├── users/
│   ├── profile.js                  # GET/PATCH /api/users/profile → User settings & preferences
│   └── preferences.js              # PATCH /api/users/preferences → NLP sensitivity, defaults
│
└── health/
    └── index.js                    # GET  /api/health         → Liveness check for Railway
                                    # GET  /api/health/db      → Supabase connection check
                                    # GET  /api/health/nlp     → Gemini API reachability check
                                    # GET  /api/health/n8n     → ngrok tunnel + n8n reachability
```

---

## `/src/services/` — Business Logic Layer

```
src/services/
├── nlp.service.js                  # Gemini API calls, prompt building, response parsing
│                                   # ⚠️ NOTE: Do NOT set responseMimeType: 'application/json'
│                                   #         — causes empty responses (known Gemini quirk)
├── task.service.js                 # Task lifecycle: create, update, status transitions
├── hitl.service.js                 # HITL queue management, confirm/reject logic
├── automation.service.js           # n8n REST API calls (trigger, poll, list workflows)
└── auth.service.js                 # Token verification, session helpers via Supabase Auth
```

---

## `/src/repositories/` — Data Access Layer (Supabase)

```
src/repositories/
├── task.repository.js              # tasks table CRUD + filters
├── hitl.repository.js              # hitl_queue table read/write
├── user.repository.js              # users / user_preferences tables
└── automation.repository.js        # automation_logs table (execution history)
```

---

## `/src/middleware/` — Express Middleware

```
src/middleware/
├── auth.middleware.js              # Verify Supabase JWT on every protected route
├── validate.middleware.js          # Zod/Joi schema validation per route
├── rateLimit.middleware.js         # Per-IP rate limiting (express-rate-limit)
├── errorHandler.middleware.js      # Global error handler — catches ApiError + Zod errors
└── requestLogger.middleware.js     # Structured request/response logging
```

---

## `/src/utils/`

```
src/utils/
├── ApiError.js                     # Custom error class (statusCode, message, isOperational)
├── asyncHandler.js                 # Wraps async route handlers, auto-catches errors
├── geminiClient.js                 # Initialised Gemini SDK client (singleton)
├── supabaseClient.js               # Supabase admin client (singleton, service role key)
├── n8nClient.js                    # n8n REST API client (axios instance pointing to ngrok URL)
└── responseHelper.js               # Standardised success/error JSON response shapes
```

---

## `/src/config/`

```
src/config/
├── index.js                        # Loads & exports all env vars with validation
├── gemini.config.js                # Gemini model selection, generation params
└── n8n.config.js                   # n8n base URL (ngrok), workflow ID mappings
```

---

## Environment Variables (`.env.example`)

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# n8n (local via ngrok tunnel)
N8N_BASE_URL=https://xxxx.ngrok-free.app
N8N_API_KEY=your_n8n_api_key

# Auth
JWT_SECRET=your_jwt_secret
```

---

## API Route Summary Table

| Method | Route                          | Description                          | Auth |
|--------|-------------------------------|--------------------------------------|------|
| POST   | /api/nlp/extract              | Extract structured tasks from text   | ✅   |
| POST   | /api/nlp/parse                | Classify intent / priority / due     | ✅   |
| POST   | /api/nlp/validate             | Re-validate edited task object       | ✅   |
| GET    | /api/tasks                    | List user's tasks                    | ✅   |
| POST   | /api/tasks                    | Create single task                   | ✅   |
| POST   | /api/tasks/bulk               | Create multiple tasks at once        | ✅   |
| GET    | /api/tasks/:id                | Get single task                      | ✅   |
| PUT    | /api/tasks/:id                | Full task update                     | ✅   |
| PATCH  | /api/tasks/:id                | Partial task update                  | ✅   |
| DELETE | /api/tasks/:id                | Soft-delete task                     | ✅   |
| GET    | /api/hitl/pending             | Fetch all unconfirmed NLP tasks      | ✅   |
| POST   | /api/hitl/confirm             | Confirm & persist extracted task     | ✅   |
| POST   | /api/hitl/reject              | Reject extracted task                | ✅   |
| PATCH  | /api/hitl/edit/:id            | Edit task before confirming          | ✅   |
| POST   | /api/automation/trigger       | Trigger n8n workflow                 | ✅   |
| POST   | /api/automation/webhook       | Receive n8n execution callback       | 🔑   |
| GET    | /api/automation/status/:id    | Poll n8n execution status            | ✅   |
| GET    | /api/automation/workflows     | List available n8n workflows         | ✅   |
| GET    | /api/auth/me                  | Get current authenticated user       | ✅   |
| POST   | /api/auth/refresh             | Refresh Supabase session             | ✅   |
| POST   | /api/auth/logout              | Logout + invalidate session          | ✅   |
| GET    | /api/users/profile            | Get user profile                     | ✅   |
| PATCH  | /api/users/profile            | Update user profile                  | ✅   |
| PATCH  | /api/users/preferences        | Update NLP/task preferences          | ✅   |
| GET    | /api/health                   | Liveness ping                        | ❌   |
| GET    | /api/health/db                | Supabase connection check            | ❌   |
| GET    | /api/health/nlp               | Gemini API reachability              | ❌   |
| GET    | /api/health/n8n               | n8n + ngrok tunnel check             | ❌   |

> ✅ = Requires Supabase JWT · 🔑 = Webhook secret header · ❌ = Public

---

## Data Flow: NLP → HITL → Task → Automation

```
Mobile App
   │
   ▼
POST /api/nlp/extract          ← Raw user text
   │  Gemini processes text
   │  Returns: [{ title, priority, due_date, category, intent }]
   ▼
POST /api/hitl/pending         ← Task stored with status = 'pending_review'
   │
   ▼  (User reviews in app)
POST /api/hitl/confirm         ← Task status → 'confirmed'
   │  or
POST /api/hitl/reject          ← Task status → 'rejected'
   │
   ▼ (on confirm)
POST /api/tasks (create)       ← Task persisted to tasks table
   │
   ▼
POST /api/automation/trigger   ← Fires matching n8n workflow
   │
   ▼
POST /api/automation/webhook   ← n8n sends execution result back
   │
   ▼
PATCH /api/tasks/:id           ← Task updated with automation result/status
```
