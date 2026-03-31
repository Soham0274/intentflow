# IntentFlow AI — Backend Build Prompt

> Use this prompt as the system/user context when asking Claude (or any AI) to implement
> any backend file. Paste the relevant section at the top of your request.

---

## 🧠 Master Context Block
> Paste this at the start of EVERY backend implementation session.

```
You are building the backend for IntentFlow AI — a mobile-first productivity platform
that converts natural language input into structured tasks using NLP, with a
Human-in-the-Loop (HITL) verification layer before task execution.

STACK:
- Runtime:     Node.js (ESM or CommonJS)
- Framework:   Express.js
- Database:    Supabase (PostgreSQL) — 6 tables, RLS policies in place
- Auth:        Supabase Auth (Google OAuth, JWT tokens)
- NLP:         Google Gemini API (free tier, model: gemini-1.5-flash)
- Automation:  n8n (running locally, exposed via ngrok tunnel)
- Hosting:     Railway (backend), local ngrok (n8n only)

CRITICAL GEMINI RULE:
⚠️  NEVER set `responseMimeType: 'application/json'` in Gemini API config.
    This causes completely empty responses. Parse JSON from plain text output instead.

ARCHITECTURE:
- src/api/          → Route handlers (thin controllers only)
- src/services/     → All business logic
- src/repositories/ → Supabase data access
- src/middleware/   → Auth, validation, error handling
- src/utils/        → Clients (Gemini, Supabase, n8n), helpers

RESPONSE SHAPE (always use this):
  Success: { success: true, data: <payload> }
  Error:   { success: false, error: "<message>", details?: <optional> }

SUPABASE TABLES:
- users            (id, email, name, avatar_url, created_at)
- tasks            (id, user_id, title, description, priority, status, due_date,
                    category, automation_triggered, created_at, updated_at)
- hitl_queue       (id, user_id, raw_input, extracted_tasks, status, created_at)
- automation_logs  (id, task_id, workflow_id, execution_id, status, result, created_at)
- user_preferences (id, user_id, default_priority, nlp_sensitivity, notifications_enabled)

TASK STATUS FLOW:
  pending_review → confirmed → in_progress → completed
                └→ rejected

All routes require Supabase JWT auth via Authorization: Bearer <token> header,
except /api/health/* and /api/automation/webhook (uses webhook secret instead).
```

---

## 📦 Prompt 1 — Project Bootstrap & Express App Setup

```
Using the master context above, create the following files:

1. src/app.js
   - Express app with JSON body parsing, CORS (allow all origins for dev)
   - Mount all routers from src/api/index.js under /api
   - Attach global error handler middleware last
   - Export the app (do not call app.listen here)

2. src/server.js
   - Import app.js, call app.listen on process.env.PORT || 3000
   - Log "IntentFlow API running on port X" on start

3. src/api/index.js
   - Import and mount all sub-routers:
     /nlp, /tasks, /hitl, /automation, /auth, /users, /health

4. src/config/index.js
   - Load and validate all env vars from .env
   - Throw on missing required vars (SUPABASE_URL, GEMINI_API_KEY, etc.)
   - Export a frozen config object

5. package.json scripts:
   "start": "node src/server.js"
   "dev": "nodemon src/server.js"
```

---

## 📦 Prompt 2 — Utility Clients

```
Using the master context, create these utility files:

1. src/utils/supabaseClient.js
   - Initialise Supabase admin client using SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
   - Export as singleton

2. src/utils/geminiClient.js
   - Initialise Google Gemini GenerativeModel with model: process.env.GEMINI_MODEL
   - ⚠️ DO NOT set responseMimeType: 'application/json' — causes empty responses
   - Export the model instance as singleton

3. src/utils/n8nClient.js
   - Axios instance with baseURL: process.env.N8N_BASE_URL
   - Default headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
   - 10 second timeout
   - Export as singleton

4. src/utils/ApiError.js
   - Class extending Error with (statusCode, message, isOperational)

5. src/utils/asyncHandler.js
   - Wraps async Express handlers: (fn) => (req, res, next) => fn(req,res,next).catch(next)

6. src/utils/responseHelper.js
   - success(res, data, statusCode=200) → res.json({ success: true, data })
   - error(res, message, statusCode=400, details) → res.json({ success: false, error, details })
```

---

## 📦 Prompt 3 — Middleware

```
Using the master context, create these middleware files:

1. src/middleware/auth.middleware.js
   - Extract Bearer token from Authorization header
   - Verify using supabase.auth.getUser(token)
   - Attach user to req.user
   - Throw 401 if missing or invalid

2. src/middleware/errorHandler.middleware.js
   - Catch ApiError instances → respond with statusCode + message
   - Catch ZodError → 400 with validation details
   - Catch unknown errors → log to console + return 500
   - Never expose stack traces in production (check NODE_ENV)

3. src/middleware/validate.middleware.js
   - Factory: validate(schema) returns middleware
   - Validates req.body against a Zod schema
   - Throws 400 with field-level errors on failure

4. src/middleware/requestLogger.middleware.js
   - Log: timestamp, method, path, status code, response time (ms)
   - Structured JSON format
```

---

## 📦 Prompt 4 — NLP Routes

```
Using the master context, implement the NLP service and routes.

SERVICE — src/services/nlp.service.js:
- extractTasks(rawText, userId)
    → Build a Gemini prompt that extracts tasks from rawText
    → Prompt must ask Gemini to return ONLY a JSON array, no markdown fences
    → ⚠️ Do NOT use responseMimeType: 'application/json' on the Gemini call
    → Parse the plain text response: strip any ```json fences, then JSON.parse()
    → Each task object: { title, description, priority, due_date, category, intent }
    → priority values: 'low' | 'medium' | 'high' | 'urgent'
    → Store raw_input + extracted_tasks in hitl_queue with status='pending_review'
    → Return: { hitlId, tasks[] }

- parseIntent(text)
    → Lightweight single-call Gemini classification
    → Return: { intent, priority, suggested_due_date, category }

ROUTES — src/api/nlp/index.js:
  POST /api/nlp/extract   → auth + validate(extractSchema) → nlpService.extractTasks()
  POST /api/nlp/parse     → auth + validate(parseSchema)   → nlpService.parseIntent()
  POST /api/nlp/validate  → auth + validate(validateSchema) → re-run parseIntent on edited obj

SCHEMAS (Zod):
  extractSchema: { text: z.string().min(3).max(2000) }
  parseSchema:   { text: z.string().min(3).max(500) }
  validateSchema: { task: z.object({ title, priority, due_date?, category? }) }
```

---

## 📦 Prompt 5 — HITL Routes

```
Using the master context, implement HITL (Human-in-the-Loop) routes.

SERVICE — src/services/hitl.service.js:
- getPendingTasks(userId)      → fetch hitl_queue where user_id=userId AND status='pending_review'
- confirmTask(hitlId, userId)  → set hitl_queue status='confirmed'
                                → create entry in tasks table with status='pending_review'
                                → return created task
- rejectTask(hitlId, userId)   → set hitl_queue status='rejected'
- editTask(hitlId, patch, userId) → update extracted_tasks in hitl_queue with patched values
                                    → status stays 'pending_review'

ROUTES — src/api/hitl/index.js:
  GET   /api/hitl/pending       → auth → hitlService.getPendingTasks(req.user.id)
  POST  /api/hitl/confirm       → auth + validate → hitlService.confirmTask(hitlId, userId)
  POST  /api/hitl/reject        → auth + validate → hitlService.rejectTask(hitlId, userId)
  PATCH /api/hitl/edit/:id      → auth + validate → hitlService.editTask(id, req.body, userId)

SCHEMAS:
  confirmSchema: { hitlId: z.string().uuid() }
  rejectSchema:  { hitlId: z.string().uuid(), reason?: z.string().optional() }
  editSchema:    { title?, priority?, due_date?, category?, description? } (all optional)
```

---

## 📦 Prompt 6 — Tasks CRUD Routes

```
Using the master context, implement full tasks CRUD.

REPOSITORY — src/repositories/task.repository.js:
- findAllByUser(userId, filters?)  → filter by status, priority, category, date range
- findById(taskId, userId)
- create(taskData)
- update(taskId, userId, data)
- softDelete(taskId, userId)       → set deleted_at = now(), do NOT remove row
- bulkCreate(tasksArray)

SERVICE — src/services/task.service.js:
- Wrap repository calls with business rules:
  - On create: set default priority='medium' if missing
  - On status change to 'completed': trigger automation if automation_triggered=false
  - Validate that taskId belongs to userId before any mutation

ROUTES — src/api/tasks/index.js:
  GET    /api/tasks            → auth → taskService.getAll(userId, req.query)
  POST   /api/tasks            → auth + validate → taskService.create()
  POST   /api/tasks/bulk       → auth + validate → taskService.bulkCreate()
  GET    /api/tasks/:id        → auth → taskService.getOne(id, userId)
  PUT    /api/tasks/:id        → auth + validate → taskService.update()
  PATCH  /api/tasks/:id        → auth + validate → taskService.partialUpdate()
  DELETE /api/tasks/:id        → auth → taskService.softDelete()

Query params for GET /tasks:
  status, priority, category, due_before, due_after, limit (default 50), offset (default 0)
```

---

## 📦 Prompt 7 — Automation Routes

```
Using the master context, implement automation routes that talk to n8n.

SERVICE — src/services/automation.service.js:
- triggerWorkflow(workflowId, payload)
    → POST to n8n: {N8N_BASE_URL}/api/v1/workflows/{workflowId}/run
    → Log execution to automation_logs table
    → Return { executionId, status: 'triggered' }

- getExecutionStatus(executionId)
    → GET {N8N_BASE_URL}/api/v1/executions/{executionId}
    → Return simplified { executionId, status, finishedAt, data? }

- listWorkflows()
    → GET {N8N_BASE_URL}/api/v1/workflows
    → Return simplified array: [{ id, name, active }]

- handleWebhookCallback(payload, secret)
    → Verify X-Webhook-Secret header matches process.env.N8N_WEBHOOK_SECRET
    → Update automation_logs with result
    → Update task status if payload contains taskId

ROUTES — src/api/automation/index.js:
  POST  /api/automation/trigger        → auth + validate → automationService.triggerWorkflow()
  POST  /api/automation/webhook        → verifyWebhookSecret → automationService.handleWebhookCallback()
  GET   /api/automation/status/:id     → auth → automationService.getExecutionStatus(id)
  GET   /api/automation/workflows      → auth → automationService.listWorkflows()

SCHEMAS:
  triggerSchema: { workflowId: z.string(), payload: z.record(z.any()) }
```

---

## 📦 Prompt 8 — Auth & User Routes

```
Using the master context, implement auth and user profile routes.

ROUTES — src/api/auth/index.js:
  GET   /api/auth/me       → auth middleware → return req.user (from Supabase JWT)
  POST  /api/auth/refresh  → body: { refresh_token } → supabase.auth.refreshSession()
  POST  /api/auth/logout   → auth → supabase.auth.signOut()

ROUTES — src/api/users/index.js:
  GET   /api/users/profile          → auth → fetch users table row by req.user.id
  PATCH /api/users/profile          → auth + validate → update users table
  GET   /api/users/preferences      → auth → fetch user_preferences by user_id
  PATCH /api/users/preferences      → auth + validate → upsert user_preferences

SCHEMAS:
  profileSchema:     { name?, avatar_url? }
  preferencesSchema: { default_priority?, nlp_sensitivity?, notifications_enabled? }
```

---

## 📦 Prompt 9 — Health Check Routes

```
Using the master context, implement health check endpoints.
These routes require NO authentication.

ROUTES — src/api/health/index.js:

GET /api/health
  → Return: { status: 'ok', timestamp, uptime, environment }

GET /api/health/db
  → Run: supabase.from('users').select('count').limit(1)
  → Return: { status: 'ok'|'error', latency_ms }

GET /api/health/nlp
  → Call Gemini with a 1-word test prompt: "ping"
  → ⚠️ Do NOT use responseMimeType: 'application/json'
  → Return: { status: 'ok'|'error', model, latency_ms }

GET /api/health/n8n
  → GET {N8N_BASE_URL}/api/v1/workflows?limit=1
  → Return: { status: 'ok'|'error', tunnel_url, latency_ms }

All health checks should catch errors and return { status: 'error', reason }
with HTTP 200 (not 500) — health endpoints should never throw.
```

---

## 📦 Prompt 10 — Integration Test Checklist

```
After implementing all routes, verify the following end-to-end flows work:

[ ] POST /api/nlp/extract  with real text → returns tasks array without Gemini empty response
[ ] Extracted tasks appear in GET /api/hitl/pending
[ ] POST /api/hitl/confirm creates a row in tasks table
[ ] GET /api/tasks returns the confirmed task
[ ] POST /api/automation/trigger fires n8n workflow via ngrok URL
[ ] POST /api/automation/webhook receives n8n callback and updates automation_logs
[ ] GET /api/health/db → status: ok
[ ] GET /api/health/nlp → status: ok (confirms Gemini is reachable)
[ ] GET /api/health/n8n → status: ok (confirms ngrok tunnel is live)
[ ] All protected routes return 401 without valid JWT

KNOWN ISSUES TO CHECK:
- Gemini empty responses: confirm responseMimeType is NOT set anywhere in geminiClient.js
- n8n webhook: confirm N8N_BASE_URL env var points to current ngrok URL (it changes on restart)
- Supabase RLS: service role key bypasses RLS — ensure user_id filter is always applied manually
```

---

## 🗂️ Quick Reference: File → Prompt Map

| File to build                        | Use Prompt # |
|--------------------------------------|--------------|
| app.js, server.js, api/index.js      | Prompt 1     |
| utils/* (clients, helpers)           | Prompt 2     |
| middleware/*                         | Prompt 3     |
| api/nlp/*, services/nlp.service.js   | Prompt 4     |
| api/hitl/*, services/hitl.service.js | Prompt 5     |
| api/tasks/*, repositories/task.*     | Prompt 6     |
| api/automation/*, services/auto.*    | Prompt 7     |
| api/auth/*, api/users/*              | Prompt 8     |
| api/health/*                         | Prompt 9     |
| Integration testing                  | Prompt 10    |
