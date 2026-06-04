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
  createUser: jest.fn(async ({ loginId, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      loginId,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };
    mockNextUserId += 1;
    mockUsers.push(user);
    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
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

function createTinyPngBuffer(width = 2, height = 3) {
  const buffer = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function createTextPdfBuffer(text = 'Software engineering design patterns require focused review and testing.') {
  return Buffer.from(`%PDF-1.4
1 0 obj
<<>>
stream
BT (${text}) Tj ET
endstream
endobj
%%EOF`, 'latin1');
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

    it('marks quota provider fallback without exposing raw provider body', async () => {
      const { token } = await registerTestUser();
      const rawProviderBody = 'insufficient quota diagnostic detail';
      process.env.AI_API_KEY = 'mock-provider-key';
      globalThis.fetch = jest.fn(async () => ({
        ok: false,
        status: 429,
        text: async () => rawProviderBody
      }));

      const response = await request(app)
        .post('/api/ai/questions')
        .set(createAuthHeader(token))
        .send({ question: 'Explain cohesion.' });

      const responseText = JSON.stringify(response.body);
      const warnOutput = warnSpy.mock.calls.flat().join(' ');
      expect(response.status).toBe(201);
      expect(response.body.question.answer).toContain('Fallback answer');
      expect(response.body.question.providerFallback).toEqual({ type: 'quota' });
      expect(responseText).not.toContain(rawProviderBody);
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

  describe('POST /api/ai/attachments/image-review', () => {
    it('requires authentication', async () => {
      const response = await request(app)
        .post('/api/ai/attachments/image-review')
        .attach('file', createTinyPngBuffer(), {
          filename: 'study.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(401);
    });

    it('rejects missing files', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/attachments/image-review')
        .set(createAuthHeader(token))
        .field('purpose', 'image-review');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).not.toContain('AI_API_KEY');
    });

    it('rejects unsupported file types with extension and MIME validation', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/attachments/image-review')
        .set(createAuthHeader(token))
        .attach('file', Buffer.from('plain text'), {
          filename: 'study.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details.allowedTypes).toContain('image/png');
    });

    it('rejects image files over the allowed size', async () => {
      const { token } = await registerTestUser();
      const oversizedImage = Buffer.alloc((5 * 1024 * 1024) + 1);

      const response = await request(app)
        .post('/api/ai/attachments/image-review')
        .set(createAuthHeader(token))
        .attach('file', oversizedImage, {
          filename: 'large.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(response.body)).not.toContain('large.png');
    });

    it('validates an image in memory and returns metadata without storing the file', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/attachments/image-review')
        .set(createAuthHeader(token))
        .attach('file', createTinyPngBuffer(16, 9), {
          filename: 'study.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(200);
      expect(response.body.file).toEqual({
        name: 'study.png',
        type: 'image/png',
        size: 24
      });
      expect(response.body.image).toMatchObject({
        format: 'png',
        width: 16,
        height: 9
      });
      expect(response.body.retention).toEqual({
        stored: false,
        policy: 'memory-only'
      });
      expect(response.body.textExtraction.status).toBe('unsupported');
      expect(response.body.warnings.join(' ')).toContain('OCR');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/ai/attachments/study-material', () => {
    it('requires authentication', async () => {
      const response = await request(app)
        .post('/api/ai/attachments/study-material')
        .attach('file', createTextPdfBuffer(), {
          filename: 'notes.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(401);
    });

    it('extracts text from a text-based PDF and returns fallback study drafts when provider is unavailable', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/attachments/study-material')
        .set(createAuthHeader(token))
        .attach('file', createTextPdfBuffer('Design patterns help teams reuse proven solutions during software engineering study sessions.'), {
          filename: 'notes.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body.retention.stored).toBe(false);
      expect(response.body.textExtraction.status).toBe('extracted');
      expect(response.body.textExtraction.extractedTextPreview).toContain('Design patterns');
      expect(response.body.generation.status).toBe('generated');
      expect(response.body.generation.summary.length).toBeGreaterThan(0);
      expect(response.body.generation.notes.length).toBeGreaterThan(0);
      expect(response.body.generation.quiz.length).toBeGreaterThan(0);
      expect(response.body.generation.providerFallback.type).toBe('provider');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('returns text-not-available status for image material without fake OCR output', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/ai/attachments/study-material')
        .set(createAuthHeader(token))
        .attach('file', createTinyPngBuffer(), {
          filename: 'scan.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(200);
      expect(response.body.textExtraction.status).toBe('unsupported');
      expect(response.body.textExtraction.extractedTextPreview).toBe('');
      expect(response.body.generation.status).toBe('text_not_available');
      expect(response.body.generation.summary).toEqual([]);
      expect(response.body.warnings.join(' ')).toContain('OCR');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('uses quota fallback metadata without exposing raw provider body', async () => {
      const { token } = await registerTestUser();
      const rawProviderBody = 'raw provider quota diagnostic with private details';
      process.env.AI_API_KEY = 'mock-provider-key';
      globalThis.fetch = jest.fn(async () => ({
        ok: false,
        status: 429,
        text: async () => rawProviderBody
      }));

      const response = await request(app)
        .post('/api/ai/attachments/study-material')
        .set(createAuthHeader(token))
        .attach('file', createTextPdfBuffer('Database normalization and access control should be reviewed before the final exam.'), {
          filename: 'quota.pdf',
          contentType: 'application/pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body.generation.status).toBe('generated');
      expect(response.body.generation.providerFallback.type).toBe('quota');
      expect(JSON.stringify(response.body)).not.toContain(rawProviderBody);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('status=429'));
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
