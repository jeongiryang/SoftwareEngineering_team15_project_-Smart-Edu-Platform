function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    const error = new Error('Admin permission is required');
    error.statusCode = 403;
    next(error);
    return;
  }

  next();
}

module.exports = {
  adminMiddleware
};
