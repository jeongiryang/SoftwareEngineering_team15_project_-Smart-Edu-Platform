const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../repositories/user.repository');

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Authentication token is required');
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (!user || user.status !== 'ACTIVE') {
      const error = new Error('Invalid authentication token');
      error.statusCode = 401;
      throw error;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    };
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = 'Invalid authentication token';
    }

    next(error);
  }
}

module.exports = {
  authMiddleware
};
