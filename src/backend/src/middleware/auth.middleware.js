const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../repositories/user.repository');
const { unauthorizedError } = require('../utils/errors');

function createAuthMiddleware(options = {}) {
  const allowRestricted = Boolean(options.allowRestricted);

  return async function authMiddleware(req, res, next) {
    try {
      const authorization = req.get('authorization') || '';
      const [scheme, token] = authorization.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw unauthorizedError('Authentication token is required');
      }

      const payload = verifyToken(token);
      const user = await findUserById(payload.userId);

      if (!user || (!allowRestricted && user.status !== 'ACTIVE')) {
        throw unauthorizedError('Invalid authentication token');
      }

      req.user = {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        role: user.role,
        status: user.status
      };
      next();
    } catch (error) {
      if (!error.statusCode) {
        next(unauthorizedError('Invalid authentication token'));
        return;
      }

      next(error);
    }
  };
}

const authMiddleware = createAuthMiddleware();

module.exports = {
  createAuthMiddleware,
  authMiddleware
};
