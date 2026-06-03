class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

function validationError(message = 'Validation failed', details = undefined) {
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
}

function unauthorizedError(message = 'Authentication is required') {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

function forbiddenError(message = 'Permission is required', details = undefined) {
  return new AppError(message, 403, 'FORBIDDEN', details);
}

function notFoundError(message = 'Resource not found') {
  return new AppError(message, 404, 'NOT_FOUND');
}

function conflictError(message = 'Resource already exists') {
  return new AppError(message, 409, 'CONFLICT');
}

function internalServerError(message = 'Internal Server Error') {
  return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
}

module.exports = {
  AppError,
  conflictError,
  forbiddenError,
  internalServerError,
  notFoundError,
  unauthorizedError,
  validationError
};
