/**
 * IntentFlow AI — End-to-End Smoke Test
 * Run: node scripts/smoke-test.js
 *
 * Phases:
 *   1. Backend health
 *   2. Auth (register + login)
 *   3. NLP extract (Gemini)
 *   4. HITL queue read
 *   5. HITL confirm
 *   6. Task list verification
 */

require('dotenv').config();

const BASE = `http://localhost:${process.env.PORT || 3001}`;
// Use SMOKE_EMAIL/SMOKE_PASSWORD env vars, or set your confirmed Supabase user here
// To disable email confirmation in Supabase: Auth → Settings → Disable "Enable email confirmations"
const TEST_EMAIL    = process.env.SMOKE_EMAIL    || 'test@intentflow.dev';
const TEST_PASSWORD = process.env.SMOKE_PASSWORD || 'Test1234!';

let token = '';
let hitlId = '';

// ── Helpers ────────────────────────────────────────────────────────────────────

function pass(label, info = '') {
  console.log(`  ✅ ${label}${info ? ' — ' + info : ''}`);
}

function fail(label, detail) {
  console.log(`  ❌ ${label} — ${detail}`);
}

function warn(label, detail) {
  console.log(`  ⚠️  ${label} — ${detail}`);
}

async function req(method, path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  return { status: res.status, ok: res.ok, data };
}

// ── Phase 1: Health ────────────────────────────────────────────────────────────

async function phase1_health() {
  console.log('\n── Phase 1: Backend Health ───────────────────────────────\n');
  try {
    const { ok, data, status } = await req('GET', '/health');
    if (ok && data.status === 'ok') {
      pass('GET /health', `status=ok ts=${data.timestamp}`);
    } else {
      fail('GET /health', `HTTP ${status} — ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('GET /health', `Connection refused — is backend running on port ${process.env.PORT || 3001}?`);
    console.log('\n🛑 Backend is not running. Start it with: npm run dev\n');
    process.exit(1);
  }
}

// ── Phase 2: Auth ──────────────────────────────────────────────────────────────

async function phase2_auth() {
  console.log('\n── Phase 2: Authentication ───────────────────────────────\n');

  // Register
  const reg = await req('POST', '/api/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Smoke Test User'
  });

  if (reg.ok || reg.status === 409) {
    pass('POST /api/auth/register', reg.status === 409 ? 'user already exists (ok)' : 'new user created');
  } else {
    warn('POST /api/auth/register', `HTTP ${reg.status} — ${JSON.stringify(reg.data).substring(0, 100)}`);
  }

  // Login
  const login = await req('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (login.ok && (login.data.token || login.data.data?.session?.access_token || login.data.session?.access_token)) {
    token = login.data.token
      || login.data.data?.session?.access_token
      || login.data.session?.access_token;
    pass('POST /api/auth/login', `token received (${token.substring(0, 20)}...)`);
  } else {
    fail('POST /api/auth/login', `HTTP ${login.status} — ${JSON.stringify(login.data).substring(0, 120)}`);
    console.log('\n⚠️  Auth failed — subsequent phases may fail. Check Supabase auth settings.\n');
  }
}

// ── Phase 3: NLP Extract (Gemini) ─────────────────────────────────────────────

async function phase3_nlp() {
  console.log('\n── Phase 3: NLP Extract (Gemini + Supabase) ─────────────\n');

  const testInputs = [
    'Remind me to submit the quarterly report by Friday at 5pm',
    'Call John about the budget tomorrow morning',
    'Buy groceries this evening — milk eggs bread',
  ];

  for (const text of testInputs) {
    const start = Date.now();
    const { ok, status, data } = await req('POST', '/api/nlp/extract', { text }, true);
    const ms = Date.now() - start;

    if (ok && data.data?.tasks?.length > 0) {
      const t = data.data.tasks[0];
      pass(
        `"${text.substring(0, 40)}..."`,
        `${data.data.tasks.length} task(s) | "${t.title}" | conf=${t.confidence_score}% | ${ms}ms`
      );
      hitlId = hitlId || data.data?.hitlId;
    } else if (ok && data.data?.tasks?.length === 0) {
      warn(`"${text.substring(0, 40)}..."`, `No tasks extracted (${ms}ms) — check Gemini prompt`);
      hitlId = hitlId || data.data?.hitlId;
    } else if (status === 401) {
      fail(`"${text.substring(0, 40)}..."`, 'Unauthorized — auth token missing/invalid');
    } else if (status === 429) {
      warn(`"${text.substring(0, 40)}..."`, 'Rate limited — NLP limiter hit');
    } else {
      fail(`"${text.substring(0, 40)}..."`, `HTTP ${status} — ${JSON.stringify(data).substring(0, 120)}`);
    }

    // Respect rate limit between NLP calls
    await new Promise(r => setTimeout(r, 500));
  }

  const latencyTest = await measureNLPLatency();
  console.log(`\n  📊 NLP Latency: ${latencyTest}`);
}

async function measureNLPLatency() {
  if (!token) return 'skipped (no auth token)';
  const times = [];
  for (let i = 0; i < 2; i++) {
    const start = Date.now();
    await req('POST', '/api/nlp/extract', { text: `Task number ${i + 1} due tomorrow` }, true);
    times.push(Date.now() - start);
    await new Promise(r => setTimeout(r, 1000));
  }
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const max = Math.max(...times);
  return `avg=${avg}ms | max=${max}ms${max > 5000 ? ' ⚠️  SLOW — consider gemini-1.5-flash for dev' : ' ✅'}`;
}

// ── Phase 4: HITL Queue ────────────────────────────────────────────────────────

async function phase4_hitl_queue() {
  console.log('\n── Phase 4: HITL Queue Read ──────────────────────────────\n');

  const { ok, status, data } = await req('GET', '/api/hitl/pending', null, true);

  if (ok) {
    const items = Array.isArray(data.data) ? data.data : [];
    pass('GET /api/hitl/pending', `${items.length} pending item(s)`);
    if (!hitlId && items.length > 0) hitlId = items[0].id;
  } else {
    fail('GET /api/hitl/pending', `HTTP ${status} — ${JSON.stringify(data).substring(0, 100)}`);
  }
}

// ── Phase 5: HITL Confirm ─────────────────────────────────────────────────────

async function phase5_hitl_confirm() {
  console.log('\n── Phase 5: HITL Confirm Flow ────────────────────────────\n');

  if (!hitlId) {
    warn('HITL confirm', 'No hitlId available — skipping (run NLP extract first)');
    return;
  }

  const { ok, status, data } = await req('POST', '/api/hitl/confirm', { hitlId }, true);

  if (ok) {
    pass('POST /api/hitl/confirm', `status=${data.data?.status || 'approved'} | hitlId=${hitlId}`);
  } else if (status === 409 || data?.message?.includes('already')) {
    warn('POST /api/hitl/confirm', 'Item already processed (safe to ignore)');
  } else {
    fail('POST /api/hitl/confirm', `HTTP ${status} — ${JSON.stringify(data).substring(0, 120)}`);
  }
}

// ── Phase 6: Task List ────────────────────────────────────────────────────────

async function phase6_tasks() {
  console.log('\n── Phase 6: Task List Verification ──────────────────────\n');

  const { ok, status, data } = await req('GET', '/api/tasks', null, true);

  if (ok) {
    const tasks = Array.isArray(data.data) ? data.data : [];
    pass('GET /api/tasks', `${tasks.length} task(s) in database`);
    if (tasks.length > 0) {
      const t = tasks[0];
      console.log(`     Latest: "${t.title}" | status=${t.status} | priority=${t.priority}`);
    }
  } else {
    fail('GET /api/tasks', `HTTP ${status} — ${JSON.stringify(data).substring(0, 100)}`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║    IntentFlow AI — Smoke Test Suite              ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  Target: ${BASE.padEnd(40)}║`);
  console.log(`║  Email:  ${TEST_EMAIL.substring(0, 40).padEnd(40)}║`);
  console.log('╚═══════════════════════════════════════════════════╝');

  const start = Date.now();
  await phase1_health();
  await phase2_auth();
  await phase3_nlp();
  await phase4_hitl_queue();
  await phase5_hitl_confirm();
  await phase6_tasks();

  console.log(`\n${'─'.repeat(52)}`);
  console.log(`✅ Smoke test complete in ${((Date.now() - start) / 1000).toFixed(1)}s\n`);
  console.log('If any ❌ above, check:');
  console.log('  • Backend logs in the terminal running npm run dev');
  console.log('  • Supabase table existence: run node scripts/setup-db.js');
  console.log('  • GEMINI_API_KEY is correct in backend/.env\n');
}

main().catch(err => {
  console.error('\n💥 Unhandled error:', err.message);
  process.exit(1);
});
