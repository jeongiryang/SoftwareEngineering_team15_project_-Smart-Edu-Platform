const { forbiddenError } = require('../utils/errors');

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    next(forbiddenError('Admin permission is required'));
    return;
  }

  next();
}

module.exports = {
  adminMiddleware
};
