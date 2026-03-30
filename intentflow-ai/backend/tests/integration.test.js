/**
 * Integration Test Suite — IntentFlow AI
 * Tests the complete flow: DB ↔ Backend ↔ NLP ↔ HITL
 * 
 * Prerequisites:
 *   1. Backend server must be running: node server.js
 *   2. A test user must exist in the database (run test-db.js first)
 *   3. You need a valid Supabase auth token for the test user
 * 
 * Usage: node tests/integration.test.js
 * 
 * NOTE: For unauthenticated testing, update API_BASE and add auth headers
 */

require('dotenv').config();
const supabase = require('../config/supabase');

const API_BASE = `http://localhost:${process.env.PORT || 3001}`;

// ═══════════════════════════════════════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════════════════════════════════════

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passCount++;
    console.log(`  ✅ ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

function skip(testName, reason) {
  skipCount++;
  console.log(`  ⏭️  ${testName} — SKIPPED: ${reason}`);
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1: Database ↔ Backend (Isolated)
// ═══════════════════════════════════════════════════════════════════════════════

async function testPhase1_Database() {
  console.log('\n═══ PHASE 1: Database ↔ Backend ═══\n');

  // Test Supabase connection
  const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
  assert(!userErr, 'Supabase connection works');
  assert(users && users.length > 0, 'Users table has data');

  if (!users || users.length === 0) {
    console.log('  ⚠️  No users found — run test-db.js first');
    return null;
  }

  const userId = users[0].id;

  // Test task CRUD directly via Supabase (bypasses backend/auth)
  const { data: newTask, error: insertErr } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: 'Integration Test Task',
      priority: 'medium',
      category: 'work',
      status: 'active',
    })
    .select()
    .single();

  assert(!insertErr, 'Task INSERT works', insertErr?.message);

  if (newTask) {
    // Read
    const { data: readTask, error: readErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', newTask.id)
      .single();
    assert(!readErr && readTask.title === 'Integration Test Task', 'Task SELECT works');

    // Update
    const { error: updateErr } = await supabase
      .from('tasks')
      .update({ title: 'Updated Integration Test' })
      .eq('id', newTask.id);
    assert(!updateErr, 'Task UPDATE works');

    // Delete
    const { error: deleteErr } = await supabase
      .from('tasks')
      .delete()
      .eq('id', newTask.id);
    assert(!deleteErr, 'Task DELETE works');
  }

  // Test HITL queue table access
  const { error: hitlErr } = await supabase.from('hitl_queue').select('id').limit(1);
  assert(!hitlErr, 'HITL queue table accessible');

  // Test NLP feedback table access
  const { error: fbErr } = await supabase.from('nlp_feedback').select('id').limit(1);
  assert(!fbErr, 'NLP feedback table accessible');

  // Test projects table access
  const { error: projErr } = await supabase.from('projects').select('id').limit(1);
  assert(!projErr, 'Projects table accessible');

  return userId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: NLP Engine ↔ Backend (Isolated)
// ═══════════════════════════════════════════════════════════════════════════════

async function testPhase2_NLP() {
  console.log('\n═══ PHASE 2: NLP Engine ↔ Backend ═══\n');

  const { extractTaskIntent } = require('../services/nlp');

  const testInputs = [
    'Call John tomorrow at 3pm',
    'Buy groceries this week',
    'URGENT fix production bug',
    'something about things',
    'Schedule meeting with Sarah next Monday morning',
    'Water the plants when you get a chance',
    'Pay electricity bill by end of month',
    'Go to gym tomorrow evening',
    'Submit report to Mike by Friday',
    'Emergency server restart needed ASAP',
  ];

  let schemaValid = 0;
  let totalLatency = 0;

  for (const input of testInputs) {
    const start = Date.now();
    const result = await extractTaskIntent(input);
    const latency = Date.now() - start;
    totalLatency += latency;

    if (result.success && result.data) {
      schemaValid++;
      assert(
        result.data.title && result.data.title.length >= 1,
        `NLP: "${input.substring(0, 30)}..." → "${result.data.title}" (${result.confidence}%, ${latency}ms)`
      );
    } else {
      assert(false, `NLP: "${input.substring(0, 30)}..." → FAILED`, result.error);
    }
  }

  const schemaRate = Math.round((schemaValid / testInputs.length) * 100);
  const avgLatency = Math.round(totalLatency / testInputs.length);

  console.log(`\n  📊 Schema validity: ${schemaRate}% (target: 100%)`);
  console.log(`  📊 Avg latency: ${avgLatency}ms`);
  assert(schemaRate === 100, 'All NLP outputs have valid schema');
  assert(avgLatency < 5000, `Average NLP latency < 5s (got ${avgLatency}ms)`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3: HITL Flow (Isolated)
// ═══════════════════════════════════════════════════════════════════════════════

async function testPhase3_HITL(userId) {
  console.log('\n═══ PHASE 3: HITL Flow ═══\n');

  if (!userId) {
    skip('HITL flow', 'No test user available');
    return;
  }

  const taskService = require('../services/taskService');

  // Submit text → should create HITL queue entry
  const submitResult = await taskService.submitToHITL(userId, 'Fix the leaking faucet on Saturday high priority');
  assert(submitResult.queue_id, 'HITL submit creates queue entry');
  assert(submitResult.confidence > 0, `HITL confidence > 0 (got ${submitResult.confidence})`);

  if (!submitResult.autoApproved) {
    // Approve the item
    const approveResult = await taskService.approveHITL(
      submitResult.queue_id,
      userId,
      submitResult.extracted_data
    );
    assert(approveResult.task, 'HITL approve creates task');
    assert(approveResult.task.title, 'Approved task has title');

    // Try to approve again (should fail — race condition guard)
    try {
      await taskService.approveHITL(submitResult.queue_id, userId, submitResult.extracted_data);
      assert(false, 'Double-approve should fail (race condition)');
    } catch (err) {
      assert(err.statusCode === 409, 'Double-approve returns 409 Conflict');
    }

    // Clean up
    await supabase.from('tasks').delete().eq('id', approveResult.task.id);
  } else {
    assert(true, 'HITL auto-approved (high confidence)');
  }

  // Test reject flow
  const rejectSubmit = await taskService.submitToHITL(userId, 'this is gibberish test 12345');
  if (!rejectSubmit.autoApproved) {
    const rejectResult = await taskService.rejectHITL(rejectSubmit.queue_id, 'Test rejection');
    assert(rejectResult.message === 'Extraction rejected', 'HITL reject works');

    // Try double-reject 
    try {
      await taskService.rejectHITL(rejectSubmit.queue_id, 'Double reject');
      assert(false, 'Double-reject should fail');
    } catch (err) {
      assert(err.statusCode === 409, 'Double-reject returns 409 Conflict');
    }
  }

  // Check pending count
  const pending = await taskService.getPendingHITL(userId);
  assert(Array.isArray(pending), 'getPendingHITL returns array');

  // Check stats
  const stats = await taskService.getHITLStats(userId);
  assert(stats.total >= 0, 'getHITLStats returns stats');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4: API Endpoints (Health Check + Public)
// ═══════════════════════════════════════════════════════════════════════════════

async function testPhase4_API() {
  console.log('\n═══ PHASE 4: API Endpoints ═══\n');

  // Health check (public)
  try {
    const health = await fetchJSON(`${API_BASE}/health`);
    assert(health.status === 200, 'Health check returns 200');
    assert(health.body.status === 'ok', 'Health check body has status: ok');
  } catch (err) {
    assert(false, 'Health check endpoint', `Server not running? ${err.message}`);
    return;
  }

  // Protected route without auth (should 401)
  const noAuth = await fetchJSON(`${API_BASE}/api/tasks`);
  assert(noAuth.status === 401, 'Protected route without auth returns 401');

  // 404 handler
  const notFound = await fetchJSON(`${API_BASE}/api/nonexistent`);
  assert(notFound.status === 401 || notFound.status === 404, 'Non-existent route handled');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Runner
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  IntentFlow AI — Integration Test Suite');
  console.log('═══════════════════════════════════════════');

  const startTime = Date.now();

  try {
    const userId = await testPhase1_Database();
    await testPhase2_NLP();
    await testPhase3_HITL(userId);
    await testPhase4_API();
  } catch (err) {
    console.error('\n💥 CRITICAL FAILURE:', err.message);
    console.error(err.stack);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  console.log('\n═══════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅ Passed:  ${passCount}`);
  console.log(`  ❌ Failed:  ${failCount}`);
  console.log(`  ⏭️  Skipped: ${skipCount}`);
  console.log(`  ⏱️  Time:    ${totalTime}s`);
  console.log('═══════════════════════════════════════════');

  if (failCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else {
    console.log(`\n⚠️  ${failCount} test(s) failed — review output above`);
    process.exitCode = 1;
  }
}

runAllTests().catch(console.error);
