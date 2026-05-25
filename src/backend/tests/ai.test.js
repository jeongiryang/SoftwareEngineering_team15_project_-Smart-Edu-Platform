const mockUsers = [];
const mockQuestions = [];
const mockRecommendations = [];
const mockWrongAnswerNotes = [];
const mockNotes = [];
let mockNextUserId = 1;
let mockNextQuestionId = 1;
let mockNextRecommendationId = 1;
let mockNextWrongAnswerNoteId = 1;
let mockNextNoteId = 1;

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ email, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      email,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };
    mockNextUserId += 1;
    mockUsers.push(user);
    return user;
  }),
  findUserByEmail: jest.fn(async (email) => mockUsers.find((user) => user.email === email) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/ai.repository', () => ({
  createAIQuestion: jest.fn(async (userId, data) => {
    const record = {
      id: mockNextQuestionId,
      userId,
      createdAt: new Date(),
      ...data
    };
    mockNextQuestionId += 1;
    mockQuestions.push(record);
    return record;
  }),
  createAIRecommendation: jest.fn(async (userId, data) => {
    const record = {
      id: mockNextRecommendationId,
      userId,
      createdAt: new Date(),
      ...data
    };
    mockNextRecommendationId += 1;
    mockRecommendations.push(record);
    return record;
  }),
  createWrongAnswerNote: jest.fn(async (userId, data) => {
    const record = {
      id: mockNextWrongAnswerNoteId,
      userId,
      createdAt: new Date(),
      ...data
    };
    mockNextWrongAnswerNoteId += 1;
    mockWrongAnswerNotes.push(record);
    return record;
  }),
  findStudyNoteByIdAndUserId: jest.fn(async (noteId, userId) =>
    mockNotes.find((note) => note.id === Number(noteId) && note.userId === Number(userId)) || null
  )
}));

jest.mock('../src/repositories/schedule.repository', () => ({
  findSchedulesByUserId: jest.fn(async (userId) => [
    { id: 1, userId, title: 'Math study', subject: 'Math' },
    { id: 2, userId, title: 'English reading', subject: 'English' }
  ])
}));

jest.mock('../src/repositories/task.repository', () => ({
  findTasksByUserId: jest.fn(async (userId) => [
    { id: 1, userId, title: 'Solve algebra', status: 'TODO' },
    { id: 2, userId, title: 'Memorize words', status: 'DONE' }
  ])
}));

const request = require('supertest');
const app = require('../src/app');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');
const aiService = require('../src/services/ai.service');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    token: response.body.token,
    user: response.body.user
  };
}

function createMockNote(userId, overrides = {}) {
  const note = {
    id: mockNextNoteId,
    userId,
    title: 'Test note',
    content: 'Study note content',
    subject: 'Software Engineering',
    tags: [],
    ...overrides
  };
  mockNextNoteId += 1;
  mockNotes.push(note);
  return note;
}

describe('AI API integration tests', () => {
  let originalFetch;
  let originalApiKey;
  let warnSpy;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    originalApiKey = process.env.AI_API_KEY;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    process.env.AI_API_KEY = originalApiKey;
  });

  beforeEach(() => {
    mockUsers.length = 0;
    mockQuestions.length = 0;
    mockRecommendations.length = 0;
    mockWrongAnswerNotes.length = 0;
    mockNotes.length = 0;
    mockNextUserId = 1;
    mockNextQuestionId = 1;
    mockNextRecommendationId = 1;
    mockNextWrongAnswerNoteId = 1;
    mockNextNoteId = 1;

    aiService.rateLimitMap.clear();
    process.env.AI_API_KEY = '';
    globalThis.fetch = jest.fn(async () => {
      throw new Error('Unexpected external AI provider call');
    });
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('POST /api/ai/questions', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/questions')
        .send({ question: 'Test question' });

      expect(response.status).toBe(401);
    });

    it('validates required fields', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('validates maximum character length limit', async () => {
      const { token } = await registerTestUser();
      const longQuestion = 'a'.repeat(1001);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: longQuestion });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('question must be at most 1000 characters');
      expect(response.body.details).toEqual({
        field: 'question',
        currentLength: 1001,
        maxLength: 1000
      });
    });

    it('supports truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longQuestion = 'a'.repeat(1005);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: longQuestion, allowTruncate: true });

      expect(response.status).toBe(201);
      expect(response.body.question.isTruncated).toBe(true);
      expect(response.body.question.originalLength).toBe(1005);
      expect(response.body.question.question).toHaveLength(1000);
    });

    it('creates a fallback answer without calling an external provider when API key is missing', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'How should I study design patterns?' });

      expect(response.status).toBe(201);
      expect(response.body.question.answer).toContain('Fallback answer');
      expect(response.body.question.answer).not.toContain('AI_API_KEY');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('uses mocked provider response when API key is present and provider succeeds', async () => {
      const { token } = await registerTestUser();
      process.env.AI_API_KEY = 'mock-provider-key';
      globalThis.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Mock provider answer' }
                ]
              }
            }
          ]
        })
      }));

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain encapsulation.' });

      expect(response.status).toBe(201);
      expect(response.body.question.answer).toBe('Mock provider answer');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('falls back on provider non-OK response without logging raw provider body', async () => {
      const { token } = await registerTestUser();
      const rawProviderBody = 'raw provider body with internal diagnostic detail';
      process.env.AI_API_KEY = 'mock-provider-key';
      globalThis.fetch = jest.fn(async () => ({
        ok: false,
        status: 503,
        text: async () => rawProviderBody
      }));

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain cohesion.' });

      const warnOutput = warnSpy.mock.calls.flat().join(' ');
      expect(response.status).toBe(201);
      expect(response.body.question.answer).toContain('Fallback answer');
      expect(warnOutput).not.toContain(rawProviderBody);
    });

    it('accepts noteId only when the note belongs to the current user', async () => {
      const { token, user } = await registerTestUser();
      const note = createMockNote(user.id);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain this note.', noteId: note.id });

      expect(response.status).toBe(201);
      expect(response.body.question.noteId).toBe(note.id);
    });

    it('rejects invalid noteId values', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain this note.', noteId: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 for a missing noteId', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain this note.', noteId: 9999 });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('does not allow another user noteId', async () => {
      const { user: owner } = await registerTestUser();
      const { token } = await registerTestUser();
      const note = createMockNote(owner.id);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain this note.', noteId: note.id });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/ai/recommendations', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations');

      expect(response.status).toBe(401);
    });

    it('generates fallback study recommendations', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/recommendations')
        .set(createAuthHeader(token));

      expect(response.status).toBe(201);
      expect(response.body.recommendation.basisJson.scheduleCount).toBe(2);
      expect(response.body.recommendation.recommendationJson.tips).toHaveLength(3);
      expect(response.body.recommendation.recommendationJson.recommendedSubject).toBe('Math');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/ai/summary', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/summary')
        .send({ content: 'Long text' });

      expect(response.status).toBe(401);
    });

    it('validates content is required', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('validates maximum character length limit', async () => {
      const { token } = await registerTestUser();
      const longContent = 'a'.repeat(3001);

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: longContent });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('content must be at most 3000 characters');
      expect(response.body.details).toEqual({
        field: 'content',
        currentLength: 3001,
        maxLength: 3000
      });
    });

    it('supports truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longContent = 'a'.repeat(3005);

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: longContent, allowTruncate: true });

      expect(response.status).toBe(200);
      expect(response.body.isTruncated).toBe(true);
      expect(response.body.originalLength).toBe(3005);
      expect(response.body.summary).toContain('- ');
    });

    it('summarizes input text using fallback without external provider', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: 'Operating systems manage processes, memory, and file systems.' });

      expect(response.status).toBe(200);
      expect(response.body.summary).toContain('- ');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/ai/wrong-answers', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .send({ problem: 'Problem content' });

      expect(response.status).toBe(401);
    });

    it('validates problem is required', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('validates maximum character length limit', async () => {
      const { token } = await registerTestUser();
      const longProblem = 'a'.repeat(1001);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({ problem: longProblem });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('problem must be at most 1000 characters');
      expect(response.body.details).toEqual({
        field: 'problem',
        currentLength: 1001,
        maxLength: 1000
      });
    });

    it('supports truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longProblem = 'a'.repeat(1005);
      const longAnswer = 'b'.repeat(1010);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({ problem: longProblem, userAnswer: longAnswer, allowTruncate: true });

      expect(response.status).toBe(201);
      expect(response.body.wrongAnswerNote.isProblemTruncated).toBe(true);
      expect(response.body.wrongAnswerNote.isUserAnswerTruncated).toBe(true);
      expect(response.body.wrongAnswerNote.originalProblemLength).toBe(1005);
      expect(response.body.wrongAnswerNote.originalUserAnswerLength).toBe(1010);
      expect(response.body.wrongAnswerNote.problem).toHaveLength(1000);
      expect(response.body.wrongAnswerNote.userAnswer).toHaveLength(1000);
    });

    it('analyzes wrong answer using fallback and saves the record', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({
          problem: '5 * 5 + 3 = ?',
          userAnswer: '25'
        });

      expect(response.status).toBe(201);
      expect(response.body.wrongAnswerNote.weakType).toBe('calculation mistake');
      expect(response.body.wrongAnswerNote.explanation).toContain('Fallback analysis');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('accepts noteId only when the note belongs to the current user', async () => {
      const { token, user } = await registerTestUser();
      const note = createMockNote(user.id);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({
          problem: 'Define cohesion.',
          userAnswer: 'A class has many responsibilities.',
          noteId: note.id
        });

      expect(response.status).toBe(201);
      expect(response.body.wrongAnswerNote.noteId).toBe(note.id);
    });

    it('does not allow another user noteId for wrong-answer analysis', async () => {
      const { user: owner } = await registerTestUser();
      const { token } = await registerTestUser();
      const note = createMockNote(owner.id);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({
          problem: 'Define coupling.',
          userAnswer: 'It means no dependency.',
          noteId: note.id
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Rate limiter', () => {
    it('allows up to 5 requests but blocks the 6th call within one minute', async () => {
      const { token } = await registerTestUser();

      for (let i = 0; i < 5; i += 1) {
        const response = await request(app)
          .post('/api/ai/questions')
          .set(createAuthHeader(token))
          .send({ question: `Question ${i}` });
        expect(response.status).toBe(201);
      }

      const limitResponse = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Question 6' });

      expect(limitResponse.status).toBe(429);
      expect(limitResponse.body.code).toBe('TOO_MANY_REQUESTS');
    });
  });
});
