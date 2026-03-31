const { createClient } = require('@supabase/supabase-js');
const config = require('../config/index');

const supabase = createClient(
  config.SUPABASE.URL,
  config.SUPABASE.SERVICE_KEY
);

module.exports = supabase;