require('dotenv').config();
const supabase = require('./config/supabase');

async function testHitl() {
  console.log('🔄 1. Grabbing an existing user from the database...');
  const { data: user, error: userError } = await supabase.from('users').select('id').limit(1).single();
  
  if (userError || !user) {
    console.error('❌ No user found. Please run node test-db.js first!');
    return;
  }
  const userId = user.id;
  console.log(`👤 Running HITL tests as User ID: ${userId}`);

  const API_BASE = 'http://localhost:3001/api/hitl';

  try {
    // -------------------------------------------------------------
    // SUBMIT (POST /submit)
    // -------------------------------------------------------------
    console.log('\n📝 2. Submitting raw text to HITL/NLP...');
    const submitRes = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        input_text: 'Fix the leaking faucet on Saturday high priority'
      })
    });
    const submitData = await submitRes.json();

    if (!submitRes.ok) throw new Error(submitData.error || 'Server error');
    console.log('   ✅ Submission response:\n  ', submitData);

    const queueId = submitData.queue_id;

    if (!submitData.autoApproved) {
      // -------------------------------------------------------------
      // APPROVE (POST /approve)
      // -------------------------------------------------------------
      console.log(`\n✅ 3. Manually approving the HITL item ${queueId}...`);
      const approveRes = await fetch(`${API_BASE}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue_id: queueId,
          user_id: userId,
          final_data: submitData.extracted_data
        })
      });
      const approveData = await approveRes.json();
      console.log('   ✅ Approved successfully:\n  ', approveData);
    } else {
      console.log('\n✨ Task was auto-approved because of high confidence.');
    }

    // -------------------------------------------------------------
    // PENDING (GET /pending/:user_id)
    // -------------------------------------------------------------
    console.log(`\n🔍 4. Checking remaining pending items for user...`);
    const pendingRes = await fetch(`${API_BASE}/pending/${userId}`);
    const pendingData = await pendingRes.json();
    console.log(`   ✅ Pending count: ${pendingData.count}`);

    // -------------------------------------------------------------
    // STATS (GET /stats/:user_id)
    // -------------------------------------------------------------
    console.log(`\n📊 5. Fetching user productivity/accuracy stats...`);
    const statsRes = await fetch(`${API_BASE}/stats/${userId}`);
    const statsData = await statsRes.json();
    console.log('   ✅ Stats retrieved:\n  ', statsData.stats);

    console.log('\n🎉 HITL SYSTEM VERIFIED!');
  } catch (error) {
    console.error('\n❌ HITL TEST FAILED:', error);
  }
}

testHitl();
