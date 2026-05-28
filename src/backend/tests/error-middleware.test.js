const {
  SAFE_DATABASE_ERROR_MESSAGE,
  errorMiddleware
} = require('../src/middleware/error.middleware');
const {
  conflictError,
  notFoundError,
  validationError
} = require('../src/utils/errors');

function createMockResponse() {
  const res = {
    body: null,
    statusCode: null
  };

  res.status = jest.fn((statusCode) => {
    res.statusCode = statusCode;
    return res;
  });

  res.json = jest.fn((body) => {
    res.body = body;
    return res;
  });

  return res;
}

function runErrorMiddleware(err) {
  const res = createMockResponse();
  errorMiddleware(err, {}, res, jest.fn());
  return res;
}

describe('errorMiddleware', () => {
  test('Prisma known request error는 내부 DB 오류를 사용자 친화적 메시지로 masking한다', () => {
    const err = new Error(
      'Invalid prisma.communityBookmark.findMany() invocation. The table public.community_bookmarks does not exist in the current database.'
    );
    err.name = 'PrismaClientKnownRequestError';
    err.code = 'P2021';
    err.clientVersion = '6.8.2';

    const res = runErrorMiddleware(err);
    const responseText = JSON.stringify(res.body);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({
      message: SAFE_DATABASE_ERROR_MESSAGE,
      code: 'INTERNAL_SERVER_ERROR'
    });
    expect(responseText).not.toContain('community_bookmarks');
    expect(responseText).not.toContain('prisma.communityBookmark.findMany');
    expect(responseText).not.toContain('P2021');
  });

  test('Prisma initialization error는 DB URL과 로컬 경로를 응답에 노출하지 않는다', () => {
    const err = new Error('DATABASE_URL 설정과 C:\\local\\project\\schema.prisma 경로를 확인해야 함');
    err.name = 'PrismaClientInitializationError';
    err.clientVersion = '6.8.2';

    const res = runErrorMiddleware(err);
    const responseText = JSON.stringify(res.body);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.message).toBe(SAFE_DATABASE_ERROR_MESSAGE);
    expect(responseText).not.toContain('DATABASE_URL');
    expect(responseText).not.toContain('C:\\local');
    expect(responseText).not.toContain('schema.prisma');
  });

  test('일반 unknown error도 raw message 대신 기본 500 메시지를 반환한다', () => {
    const err = new Error('internal stack trace at C:\\local\\server\\app.js');

    const res = runErrorMiddleware(err);
    const responseText = JSON.stringify(res.body);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR'
    });
    expect(responseText).not.toContain('stack trace');
    expect(responseText).not.toContain('C:\\local');
  });

  test.each([
    [validationError('입력값을 확인해 주세요.', { field: 'title' }), 400, 'VALIDATION_ERROR'],
    [notFoundError('게시글을 찾을 수 없습니다.'), 404, 'NOT_FOUND'],
    [conflictError('이미 처리된 요청입니다.'), 409, 'CONFLICT']
  ])('의도된 AppError 응답은 기존 status/code/details를 유지한다', (err, statusCode, code) => {
    const res = runErrorMiddleware(err);

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.body.message).toBe(err.message);
    expect(res.body.code).toBe(code);

    if (err.details) {
      expect(res.body.details).toEqual(err.details);
    }
  });
});
