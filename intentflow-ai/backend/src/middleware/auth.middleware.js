const supabase = require('../utils/supabaseClient');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('../utils/ApiError');

// Simple in-memory cache to avoid repeated DB hits on every request
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(401, 'Unauthorized or expired token');
    }

    // Cache user for 5 minutes to avoid repeated DB hits
    const cached = userCache.get(user.id);
    if (cached && (Date.now() - cached.ts < CACHE_TTL_MS)) {
      req.user = cached.data;
    } else {
      const localUser = await userRepository.findOrCreate(user.id, user);
      userCache.set(user.id, { data: localUser, ts: Date.now() });
      req.user = localUser;
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAuth;