function sendSuccess(res, statusCode = 200, payload = {}) {
  return res.status(statusCode).json(payload);
}

function sendCreated(res, payload = {}) {
  return sendSuccess(res, 201, payload);
}

function sendError(res, error) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: error.message || 'Internal Server Error',
    code: error.code || 'INTERNAL_SERVER_ERROR'
  };

  if (error.details) {
    payload.details = error.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendCreated,
  sendError,
  sendSuccess
};
