require('dotenv').config();
const supabase = require('./config/supabase');

async function testApi() {
  console.log('🔄 1. Grabbing an existing user from the database...');
  // We need a valid UUID string for the database constraints! 
  // We'll borrow the first user in your users table (e.g. the one created by test-db.js)
  const { data: user, error: userError } = await supabase.from('users').select('id').limit(1).single();
  
  if (userError || !user) {
    console.error('❌ No user found. Please run node test-db.js first to create a mock user!');
    return;
  }
  const userId = user.id;
  console.log(`👤 Running REST APIs authenticated as User ID: ${userId}`);

  const API_BASE = 'http://localhost:3001/api/tasks';

  try {
    // -------------------------------------------------------------
    // CREATE (POST)
    // -------------------------------------------------------------
    console.log('\n📝 2. Sending POST request to create a new task...');
    const postRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        title: 'Master Express Routing',
        description: 'Testing the newly built CRUD APIs from the command line.',
        priority: 'urgent',
        category: 'Learning'
      })
    });
    const postData = await postRes.json();

    if (!postRes.ok) throw new Error(postData.error || 'Server error');
    console.log('   ✅ API responded successfully:\n  ', postData);

    const taskId = postData.task.id;

    // -------------------------------------------------------------
    // READ (GET)
    // -------------------------------------------------------------
    console.log(`\n🔍 3. Sending GET request to fetch task ${taskId}...`);
    const getRes = await fetch(`${API_BASE}/${taskId}`);
    const getData = await getRes.json();
    console.log('   ✅ API correctly retrieved task:\n  ', getData);

    // -------------------------------------------------------------
    // UPDATE (PATCH to complete)
    // -------------------------------------------------------------
    console.log(`\n⭐ 4. Sending PATCH request to complete task ${taskId}...`);
    const patchRes = await fetch(`${API_BASE}/${taskId}/complete`, { method: 'PATCH' });
    const patchData = await patchRes.json();
    console.log('   ✅ API successfully changed status to completed:\n  ', patchData);

    // -------------------------------------------------------------
    // DELETE (DELETE)
    // -------------------------------------------------------------
    console.log(`\n🧨 5. Sending DELETE request to destroy task ${taskId}...`);
    const delRes = await fetch(`${API_BASE}/${taskId}`, { method: 'DELETE' });
    const delData = await delRes.json();
    console.log('   ✅ API successfully deleted task:\n  ', delData);

    console.log('\n🎉 ALL TESTS PASSED! Your REST API is bulletproof.');
  } catch (error) {
    console.error('\n❌ REQUEST FAILED:', error.message);
    console.log('   💡 Make sure your backend server is actually running! Open a new terminal and run: node server.js');
  }
}

testApi();
