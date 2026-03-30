/**
 * Authentication Middleware
 * Verifies Supabase JWT and attaches user to request
 */

const { createClient } = require('@supabase/supabase-js');
const { AuthenticationError } = require('../errors/ApiError');

// Create a separate Supabase client for auth verification
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key for auth verification
);

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user info to request for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
    };

    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return next(err);
    }
    next(new AuthenticationError('Authentication failed'));
  }
}

module.exports = authMiddleware;
