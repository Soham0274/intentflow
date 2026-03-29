require('dotenv').config();
const supabase = require('./config/supabase');

async function runVisualTest() {
  console.log('🔗 1. Initiating Supabase Connection...\n');

  try {
    // 1. Create a mock user
    console.log('👤 2. Creating a mock user...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        oauth_id: 'mock_oauth_12345',
        email: 'mockuser@intentflow.com',
        name: 'Visual Test User',
      })
      .select()
      .single();

    if (userError) throw userError;
    console.log('   ✅ User Created:', newUser.id, '\n');

    // 2. Create a mock task linked to this user
    console.log('📝 3. Inserting a new task for this user...');
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: newUser.id,
        title: 'Review Visual Database Test',
        description: 'Ensuring Supabase insertion and retrieval works flawlessly.',
        priority: 'high',
        status: 'pending',
        category: 'work',
        due_date: new Date().toISOString().split('T')[0] // Today
      })
      .select()
      .single();

    if (taskError) throw taskError;
    console.log('   ✅ Task Created:', newTask.title, '\n');

    // 3. Fetch the tasks back out
    console.log('🔍 4. Fetching the saved task from the database...');
    const { data: fetchedTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*, users(name, email)')
      .eq('id', newTask.id);

    if (fetchError) throw fetchError;
    console.log('   ✅ Successfully Fetched Data:');
    console.log(JSON.stringify(fetchedTasks, null, 2), '\n');

    // 4. Cleanup
    console.log('🧹 5. Data has been left in the database for you to view on Supabase Dashboard!');
    // const { error: cleanError } = await supabase
    //   .from('users')
    //   .delete()
    //   .eq('id', newUser.id);
      
    // if (cleanError) throw cleanError;

  } catch (error) {
    console.error('\n❌ DATABASE ERROR:', error.message);
  }
}

runVisualTest();
