const { sendError } = require('../utils/apiResponse');
const { internalServerError } = require('../utils/errors');

const SAFE_DATABASE_ERROR_MESSAGE =
  '서버 데이터 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.';

function isPrismaError(err) {
  return (
    err?.name?.startsWith('PrismaClient') ||
    typeof err?.clientVersion === 'string' ||
    (typeof err?.code === 'string' && /^P\d{4}$/.test(err.code))
  );
}

function errorMiddleware(err, req, res, next) {
  const error = err.statusCode
    ? err
    : internalServerError(isPrismaError(err) ? SAFE_DATABASE_ERROR_MESSAGE : undefined);

  sendError(res, error);
}

module.exports = {
  SAFE_DATABASE_ERROR_MESSAGE,
  errorMiddleware
};
