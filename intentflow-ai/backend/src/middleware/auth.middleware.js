const supabase = require('../utils/supabaseClient');
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

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(401, 'Unauthorized or expired token');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireAuth;