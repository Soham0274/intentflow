const supabase = require('../utils/supabaseClient');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('../utils/ApiError');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Missing Bearer token');
    }

    // Always fetch and verify user via the Supabase Auth server.
    // Using getUser instead of getSession ensures the JWT is valid and hasn't been revoked.
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(401, 'Unauthorized or expired token');
    }

    // Fetch the correct db row strictly for this active auth user
    // No global mapping to prevent data cross-contamination
    const localUser = await userRepository.findOrCreate(user.id, user);
    
    // Explicitly scope the authenticated user to this single request
    req.user = localUser;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAuth;