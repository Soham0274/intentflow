/**
 * NLP Eval Runner — IntentFlow AI
 * Runs the eval set against the NLP engine and reports metrics
 * 
 * Usage: node eval/run-eval.js
 */

require('dotenv').config();

const { extractTaskIntent } = require('../services/nlp');
const evalSet = require('./eval-set.json');

// ─── Metrics ──────────────────────────────────────────────────────────────────

async function runEval() {
  console.log('═══════════════════════════════════════════');
  console.log('  IntentFlow AI — NLP Evaluation Runner');
  console.log(`  Running ${evalSet.length} test cases...`);
  console.log('═══════════════════════════════════════════\n');

  const results = [];
  const latencies = [];
  let schemaValid = 0;
  let fieldAccurate = 0;
  let totalFieldChecks = 0;
  let hitlTriggered = 0;

  for (const testCase of evalSet) {
    const start = Date.now();
    const result = await extractTaskIntent(testCase.input);
    const latency = Date.now() - start;
    latencies.push(latency);

    const checks = [];

    // ── Schema validity check ──
    if (result.success && result.data) {
      schemaValid++;
      checks.push('✅ Valid schema');

      // ── Field accuracy checks ──
      const expected = testCase.expected;
      const data = result.data;

      if (expected.title_contains) {
        totalFieldChecks++;
        if (data.title?.toLowerCase().includes(expected.title_contains.toLowerCase())) {
          fieldAccurate++;
          checks.push(`✅ Title contains "${expected.title_contains}"`);
        } else {
          checks.push(`❌ Title missing "${expected.title_contains}" (got: "${data.title}")`);
        }
      }

      if (expected.due_date_set !== undefined) {
        totalFieldChecks++;
        const hasDueDate = !!data.due_date;
        if (hasDueDate === expected.due_date_set) {
          fieldAccurate++;
          checks.push(`✅ due_date ${expected.due_date_set ? 'present' : 'absent'}`);
        } else {
          checks.push(`❌ due_date expected ${expected.due_date_set ? 'present' : 'absent'} (got: ${data.due_date})`);
        }
      }

      if (expected.due_date) {
        totalFieldChecks++;
        if (data.due_date === expected.due_date) {
          fieldAccurate++;
          checks.push(`✅ due_date = ${expected.due_date}`);
        } else {
          checks.push(`❌ due_date expected ${expected.due_date} (got: ${data.due_date})`);
        }
      }

      if (expected.due_time) {
        totalFieldChecks++;
        if (data.due_time === expected.due_time) {
          fieldAccurate++;
          checks.push(`✅ due_time = ${expected.due_time}`);
        } else {
          checks.push(`❌ due_time expected ${expected.due_time} (got: ${data.due_time})`);
        }
      }

      if (expected.priority) {
        totalFieldChecks++;
        if (data.priority === expected.priority) {
          fieldAccurate++;
          checks.push(`✅ priority = ${expected.priority}`);
        } else {
          checks.push(`❌ priority expected ${expected.priority} (got: ${data.priority})`);
        }
      }

      if (expected.category) {
        totalFieldChecks++;
        if (data.category === expected.category) {
          fieldAccurate++;
          checks.push(`✅ category = ${expected.category}`);
        } else {
          checks.push(`❌ category expected ${expected.category} (got: ${data.category})`);
        }
      }

      if (expected.people_includes) {
        totalFieldChecks++;
        if (data.people?.some(p => p.toLowerCase().includes(expected.people_includes.toLowerCase()))) {
          fieldAccurate++;
          checks.push(`✅ people includes "${expected.people_includes}"`);
        } else {
          checks.push(`❌ people missing "${expected.people_includes}" (got: ${JSON.stringify(data.people)})`);
        }
      }

      if (expected.title_min_length) {
        totalFieldChecks++;
        if (data.title?.length >= expected.title_min_length) {
          fieldAccurate++;
          checks.push(`✅ title length ≥ ${expected.title_min_length}`);
        } else {
          checks.push(`❌ title too short (${data.title?.length} < ${expected.title_min_length})`);
        }
      }

      if (expected.description_not_null) {
        totalFieldChecks++;
        if (data.description) {
          fieldAccurate++;
          checks.push('✅ description present');
        } else {
          checks.push('❌ description is null');
        }
      }

      if (expected.max_confidence !== undefined) {
        totalFieldChecks++;
        if (result.confidence <= expected.max_confidence) {
          fieldAccurate++;
          checks.push(`✅ confidence ≤ ${expected.max_confidence} (got: ${result.confidence})`);
        } else {
          checks.push(`❌ confidence too high: ${result.confidence} > ${expected.max_confidence}`);
        }
      }

      // Track HITL trigger rate
      if (!result.autoApprove) {
        hitlTriggered++;
      }

    } else {
      checks.push(`❌ Schema invalid: ${result.error}`);
    }

    results.push({
      id: testCase.id,
      input: testCase.input.substring(0, 50) + (testCase.input.length > 50 ? '...' : ''),
      success: result.success,
      confidence: result.confidence || 0,
      autoApprove: result.autoApprove || false,
      latency,
      checks,
    });
  }

  // ─── Print Results ────────────────────────────────────────────────────────

  console.log('─── INDIVIDUAL RESULTS ──────────────────────\n');
  for (const r of results) {
    const status = r.success ? (r.autoApprove ? '🟢' : '🟡') : '🔴';
    console.log(`${status} Test #${r.id}: "${r.input}"`);
    console.log(`   Confidence: ${r.confidence} | Latency: ${r.latency}ms | Auto: ${r.autoApprove}`);
    for (const check of r.checks) {
      console.log(`   ${check}`);
    }
    console.log();
  }

  // ─── Aggregate Metrics ────────────────────────────────────────────────────

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];

  console.log('═══════════════════════════════════════════');
  console.log('  EVALUATION SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`  Schema Validity:    ${schemaValid}/${evalSet.length} (${Math.round(schemaValid/evalSet.length*100)}%) — target: 100%`);
  console.log(`  Field Accuracy:     ${fieldAccurate}/${totalFieldChecks} (${Math.round(fieldAccurate/totalFieldChecks*100)}%) — target: >85%`);
  console.log(`  HITL Trigger Rate:  ${hitlTriggered}/${evalSet.length} (${Math.round(hitlTriggered/evalSet.length*100)}%)`);
  console.log(`  Latency P50:        ${p50}ms`);
  console.log(`  Latency P95:        ${p95}ms — target: <2000ms`);
  console.log('═══════════════════════════════════════════');

  // ─── Pass/Fail Gate ───────────────────────────────────────────────────────

  const schemaRate = schemaValid / evalSet.length;
  const fieldRate = fieldAccurate / totalFieldChecks;

  if (schemaRate === 1.0 && fieldRate >= 0.85) {
    console.log('\n🎉 EVAL PASSED — Safe to ship prompt changes');
  } else {
    console.log('\n⚠️  EVAL NEEDS WORK:');
    if (schemaRate < 1.0) console.log(`   → Schema validity ${Math.round(schemaRate*100)}% < 100% target`);
    if (fieldRate < 0.85) console.log(`   → Field accuracy ${Math.round(fieldRate*100)}% < 85% target`);
  }

  return {
    schemaValidityRate: Math.round(schemaRate * 100),
    fieldAccuracyRate: Math.round(fieldRate * 100),
    hitlTriggerRate: Math.round(hitlTriggered / evalSet.length * 100),
    latencyP50: p50,
    latencyP95: p95,
    results,
  };
}

// Run if called directly
runEval().catch(console.error);

module.exports = { runEval };
