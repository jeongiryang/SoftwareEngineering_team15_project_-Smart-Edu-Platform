const mockUsers = [];
const mockQuestions = [];
const mockRecommendations = [];
const mockWrongAnswerNotes = [];
let mockNextUserId = 1;
let mockNextQuestionId = 1;
let mockNextRecommendationId = 1;
let mockNextWrongAnswerNoteId = 1;

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
  })
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

describe('AI API integration tests', () => {
  let originalFetch;
  let originalApiKey;

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
    mockNextUserId = 1;
    mockNextQuestionId = 1;
    mockNextRecommendationId = 1;
    mockNextWrongAnswerNoteId = 1;

    // Reset rate limiter maps
    aiService.rateLimitMap.clear();

    // Default to empty API key to test Fallback simulated responses without making network calls
    process.env.AI_API_KEY = '';
    jest.clearAllMocks();
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

    it('validates maximum character length limit (1000 chars)', async () => {
      const { token } = await registerTestUser();
      const longQuestion = 'a'.repeat(1001);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: longQuestion });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('최대 1000자');
      expect(response.body.details).toEqual({
        field: 'question',
        currentLength: 1001,
        maxLength: 1000
      });
    });

    it('supports smart truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longQuestion = 'a'.repeat(1005);

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: longQuestion, allowTruncate: true });

      expect(response.status).toBe(201);
      expect(response.body.question).toBeDefined();
      expect(response.body.question.isTruncated).toBe(true);
      expect(response.body.question.originalLength).toBe(1005);
      expect(response.body.question.question).toHaveLength(1000);
    });

    it('creates AI Question and returns 201 with simulated answer (Fallback mode)', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: '수학 숙제 어떻게 해?' });

      expect(response.status).toBe(201);
      expect(response.body.question).toBeDefined();
      expect(response.body.question.question).toBe('수학 숙제 어떻게 해?');
      expect(response.body.question.answer).toContain('수학 질문에 대한 답변입니다');
    });

    it('invokes Gemini API when key is present and fetch succeeds', async () => {
      const { token } = await registerTestUser();
      process.env.AI_API_KEY = 'test-api-key';

      // Mock native fetch
      globalThis.fetch = jest.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: '이것은 Gemini API가 답변한 내용입니다.' }
                ]
              }
            }
          ]
        })
      }));

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: '지구의 나이는 몇 살이야?' });

      expect(response.status).toBe(201);
      expect(response.body.question.answer).toBe('이것은 Gemini API가 답변한 내용입니다.');
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  describe('POST /api/ai/recommendations', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/recommendations');

      expect(response.status).toBe(401);
    });

    it('generates study recommendations', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/recommendations')
        .set(createAuthHeader(token));

      expect(response.status).toBe(201);
      expect(response.body.recommendation).toBeDefined();
      expect(response.body.recommendation.basisJson).toBeDefined();
      expect(response.body.recommendation.recommendationJson).toBeDefined();
      expect(response.body.recommendation.recommendationJson.recommendedSubject).toContain('Math');
      expect(response.body.recommendation.recommendationJson.tips).toHaveLength(3);
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
    });

    it('validates maximum character length limit (3000 chars)', async () => {
      const { token } = await registerTestUser();
      const longContent = 'a'.repeat(3001);

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: longContent });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('최대 3000자');
      expect(response.body.details).toEqual({
        field: 'content',
        currentLength: 3001,
        maxLength: 3000
      });
    });

    it('supports smart truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longContent = 'a'.repeat(3005);

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: longContent, allowTruncate: true });

      expect(response.status).toBe(200);
      expect(response.body.isTruncated).toBe(true);
      expect(response.body.originalLength).toBe(3005);
      expect(response.body.summary).toBeDefined();
    });

    it('summarizes input text', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/summary')
        .set(createAuthHeader(token))
        .send({ content: '운영체제는 컴퓨터 하드웨어와 사용자 사이에서...' });

      expect(response.status).toBe(200);
      expect(response.body.summary).toContain('- ');
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
    });

    it('validates maximum character length limit (1000 chars)', async () => {
      const { token } = await registerTestUser();
      const longProblem = 'a'.repeat(1001);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({ problem: longProblem });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('최대 1000자');
      expect(response.body.details).toEqual({
        field: 'problem',
        currentLength: 1001,
        maxLength: 1000
      });
    });

    it('supports smart truncation when allowTruncate is true', async () => {
      const { token } = await registerTestUser();
      const longProblem = 'a'.repeat(1005);
      const longAnswer = 'b'.repeat(1010);

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({ problem: longProblem, userAnswer: longAnswer, allowTruncate: true });

      expect(response.status).toBe(201);
      expect(response.body.wrongAnswerNote).toBeDefined();
      expect(response.body.wrongAnswerNote.isProblemTruncated).toBe(true);
      expect(response.body.wrongAnswerNote.isUserAnswerTruncated).toBe(true);
      expect(response.body.wrongAnswerNote.originalProblemLength).toBe(1005);
      expect(response.body.wrongAnswerNote.originalUserAnswerLength).toBe(1010);
      expect(response.body.wrongAnswerNote.problem).toHaveLength(1000);
      expect(response.body.wrongAnswerNote.userAnswer).toHaveLength(1000);
    });

    it('analyzes wrong answer and saves to database', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/wrong-answers')
        .set(createAuthHeader(token))
        .send({
          problem: '5 * 5 + 3 = ?',
          userAnswer: '25'
        });

      expect(response.status).toBe(201);
      expect(response.body.wrongAnswerNote).toBeDefined();
      expect(response.body.wrongAnswerNote.weakType).toBe('연산 실수');
      expect(response.body.wrongAnswerNote.explanation).toContain('사칙연산');
    });
  });

  describe('Rate Limiter', () => {
    it('allows up to 5 requests but blocks the 6th call within one minute', async () => {
      const { token } = await registerTestUser();

      // Make 5 successful calls
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/ai/questions')
          .set(createAuthHeader(token))
          .send({ question: `Question ${i}` });
        expect(response.status).toBe(201);
      }

      // 6th call should be rate limited (429)
      const limitResponse = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Question 6' });

      expect(limitResponse.status).toBe(429);
      expect(limitResponse.body.code).toBe('TOO_MANY_REQUESTS');
      expect(limitResponse.body.message).toContain('AI 호출 한도를 초과했습니다');
    });
  });
});
