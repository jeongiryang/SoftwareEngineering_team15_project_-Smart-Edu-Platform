const { sendError } = require('../utils/apiResponse');
const { internalServerError } = require('../utils/errors');

function errorMiddleware(err, req, res, next) {
  const error = err.statusCode ? err : internalServerError(err.message);

  sendError(res, error);
}

module.exports = {
  errorMiddleware
};
