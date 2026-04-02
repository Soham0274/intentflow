process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test-service-key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';
process.env.PORT = process.env.PORT || '3001';