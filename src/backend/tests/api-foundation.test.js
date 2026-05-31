const { sendCreated, sendError, sendSuccess } = require('../src/utils/apiResponse');
const { asyncHandler } = require('../src/utils/asyncHandler');
const { AppError, conflictError, forbiddenError, notFoundError, unauthorizedError, validationError } = require('../src/utils/errors');
const {
  normalizeLoginId,
  normalizeString,
  parsePositiveInteger,
  requireFields,
  validateLoginId,
  validatePassword
} = require('../src/utils/validators');
const { createAuthHeader, createUniqueLoginId, createUserPayload } = require('./helpers/auth.helper');
const { expectNoPasswordHash, expectSafeUser } = require('./helpers/assert.helper');

function createMockResponse() {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res)
  };

  return res;
}

describe('API response helpers', () => {
  it('sends success payload without wrapping it', () => {
    const res = createMockResponse();
    const payload = { user: { id: 1 } };

    sendSuccess(res, 200, payload);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('sends created payload with 201 status', () => {
    const res = createMockResponse();
    const payload = { created: true };

    sendCreated(res, payload);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('sends standardized error payload', () => {
    const res = createMockResponse();
    const error = validationError('Invalid input', { field: 'loginId' });

    sendError(res, error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid input',
      code: 'VALIDATION_ERROR',
      details: { field: 'loginId' }
    });
  });
});

describe('AppError helpers', () => {
  it('creates errors with status code and error code', () => {
    const error = new AppError('Custom error', 418, 'CUSTOM_ERROR');

    expect(error.statusCode).toBe(418);
    expect(error.code).toBe('CUSTOM_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('maps common HTTP errors', () => {
    expect(validationError().statusCode).toBe(400);
    expect(unauthorizedError().statusCode).toBe(401);
    expect(forbiddenError().statusCode).toBe(403);
    expect(notFoundError().statusCode).toBe(404);
    expect(conflictError().statusCode).toBe(409);
  });
});

describe('async handler', () => {
  it('passes rejected errors to next', async () => {
    const error = new Error('Async failure');
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('validation helpers', () => {
  it('normalizes strings and loginId values', () => {
    expect(normalizeString('  value  ')).toBe('value');
    expect(normalizeLoginId('  USER_NAME  ')).toBe('user_name');
  });

  it('throws validation error for missing required fields', () => {
    expect(() => requireFields({ loginId: '' }, ['loginId', 'password'])).toThrow(AppError);
  });

  it('validates loginId and password values', () => {
    expect(() => validateLoginId('user_01')).not.toThrow();
    expect(() => validateLoginId('user@example')).toThrow(AppError);
    expect(() => validateLoginId('invalid.login')).toThrow(AppError);
    expect(() => validatePassword('password123')).not.toThrow();
    expect(() => validatePassword('short')).toThrow(AppError);
  });

  it('parses positive integer identifiers', () => {
    expect(parsePositiveInteger('10', 'id')).toBe(10);
    expect(() => parsePositiveInteger('0', 'id')).toThrow(AppError);
    expect(() => parsePositiveInteger('invalid', 'id')).toThrow(AppError);
  });
});

describe('test helpers', () => {
  it('creates reusable auth test values', () => {
    expect(createUniqueLoginId()).toMatch(/^[a-z0-9_-]{3,30}$/);
    expect(createAuthHeader('token')).toEqual({ Authorization: 'Bearer token' });
    expect(createUserPayload()).toEqual(
      expect.objectContaining({
        loginId: expect.any(String),
        password: expect.any(String),
        name: expect.any(String)
      })
    );
  });

  it('asserts safe user payloads', () => {
    const user = {
      id: 1,
      loginId: 'user_01',
      name: 'User',
      role: 'USER'
    };

    expectSafeUser(user);
    expectNoPasswordHash(user);
  });
});
