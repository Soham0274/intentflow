const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseClient');

router.get('/', async (req, res) => {
  try {
    // Ping DB
    const { error } = await supabase.from('users').select('id').limit(1);
    const dbStatus = error ? 'down' : 'up';
    
    res.json({
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router;