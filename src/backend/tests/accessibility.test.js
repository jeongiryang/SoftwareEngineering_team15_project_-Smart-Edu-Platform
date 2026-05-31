const mockUsers = [];
const mockPreferences = [];
const mockVoiceRequests = [];
const mockNotifications = [];
let mockNextUserId = 1;
let mockNextPreferenceId = 1;
let mockNextVoiceRequestId = 1;
let mockNextNotificationId = 1;

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

jest.mock('../src/repositories/accessibility.repository', () => ({
  findPreferenceByUserId: jest.fn(async (userId) =>
    mockPreferences.find((preference) => preference.userId === Number(userId)) || null
  ),
  upsertPreference: jest.fn(async (userId, data) => {
    const existingPreference = mockPreferences.find((preference) => preference.userId === Number(userId));

    if (existingPreference) {
      Object.assign(existingPreference, data, { updatedAt: new Date() });
      return existingPreference;
    }

    const preference = {
      id: mockNextPreferenceId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    mockNextPreferenceId += 1;
    mockPreferences.push(preference);
    return preference;
  }),
  createVoiceRequest: jest.fn(async (userId, data) => {
    const record = {
      id: mockNextVoiceRequestId,
      userId,
      createdAt: new Date(),
      ...data
    };
    mockNextVoiceRequestId += 1;
    mockVoiceRequests.push(record);
    return record;
  }),
  createReviewReminder: jest.fn(async (userId, data) => {
    const record = {
      id: mockNextNotificationId,
      userId,
      type: 'REVIEW',
      readAt: null,
      createdAt: new Date(),
      ...data
    };
    mockNextNotificationId += 1;
    mockNotifications.push(record);
    return record;
  }),
  findActiveReviewReminders: jest.fn(async (userId) =>
    mockNotifications.filter((n) => n.userId === Number(userId) && n.type === 'REVIEW' && n.readAt === null)
  )
}));

const request = require('supertest');
const app = require('../src/app');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

async function registerTestUser(overrides = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send(createUserPayload(overrides));

  return {
    token: response.body.token,
    user: response.body.user
  };
}

describe('Accessibility API integration tests', () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockPreferences.length = 0;
    mockVoiceRequests.length = 0;
    mockNotifications.length = 0;
    mockNextUserId = 1;
    mockNextPreferenceId = 1;
    mockNextVoiceRequestId = 1;
    mockNextNotificationId = 1;
    jest.clearAllMocks();
  });

  describe('GET /api/accessibility/preferences', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app).get('/api/accessibility/preferences');

      expect(response.status).toBe(401);
    });

    it('returns default preference when no preference has been saved', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .get('/api/accessibility/preferences')
        .set(createAuthHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.preference).toMatchObject({
        textScale: 1,
        highContrast: false,
        elementaryFriendlyUi: false,
        voiceInputEnabled: false,
        voiceOutputEnabled: false,
        reviewReminderEnabled: false,
        reminderTime: null
      });
    });
  });

  describe('PUT /api/accessibility/preferences', () => {
    it('updates accessibility preference', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set(createAuthHeader(token))
        .send({
          textScale: 1.4,
          highContrast: true,
          elementaryFriendlyUi: true,
          reminderTime: '20:30'
        });

      expect(response.status).toBe(200);
      expect(response.body.preference).toMatchObject({
        textScale: 1.4,
        highContrast: true,
        elementaryFriendlyUi: true,
        reminderTime: '20:30'
      });
    });

    it('accepts textScale up to 2.0', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set(createAuthHeader(token))
        .send({ textScale: 2 });

      expect(response.status).toBe(200);
      expect(response.body.preference).toMatchObject({ textScale: 2 });
    });

    it('validates textScale range', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .put('/api/accessibility/preferences')
        .set(createAuthHeader(token))
        .send({ textScale: 2.1 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/accessibility/tts', () => {
    it('creates a TTS request record', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/accessibility/tts')
        .set(createAuthHeader(token))
        .send({ text: '복습 내용을 읽어 주세요.', voiceType: 'CHILD_GIRL' });

      expect(response.status).toBe(201);
      expect(response.body.speech).toMatchObject({
        mode: 'TTS',
        voiceType: 'CHILD_GIRL',
        text: '복습 내용을 읽어 주세요.',
        status: 'READY'
      });
    });

    it('validates TTS voice type', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/accessibility/tts')
        .set(createAuthHeader(token))
        .send({ text: '복습 내용을 읽어 주세요.', voiceType: 'ROBOT' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details.field).toBe('voiceType');
    });
  });

  describe('POST /api/accessibility/stt', () => {
    it('saves a STT transcript', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/accessibility/stt')
        .set(createAuthHeader(token))
        .send({ transcript: '오늘 수학 단원을 복습했다.' });

      expect(response.status).toBe(201);
      expect(response.body.speech).toMatchObject({
        mode: 'STT',
        transcript: '오늘 수학 단원을 복습했다.',
        status: 'SAVED'
      });
    });
  });

  describe('POST /api/accessibility/review-reminders', () => {
    it('creates a review notification', async () => {
      const { token } = await registerTestUser();

      const response = await request(app)
        .post('/api/accessibility/review-reminders')
        .set(createAuthHeader(token))
        .send({
          title: '영어 단어 복습',
          task: 'Day 3 단어 20개 다시 보기',
          scheduledAt: '2026-05-29T20:00:00+09:00'
        });

      expect(response.status).toBe(201);
      expect(response.body.reminder).toMatchObject({
        type: 'REVIEW',
        message: '영어 단어 복습 - Day 3 단어 20개 다시 보기'
      });
    });
  });

  describe('GET /api/accessibility/review-reminders', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app).get('/api/accessibility/review-reminders');

      expect(response.status).toBe(401);
    });

    it('returns active review reminders for the authenticated user', async () => {
      const { token } = await registerTestUser();

      await request(app)
        .post('/api/accessibility/review-reminders')
        .set(createAuthHeader(token))
        .send({
          title: '영어 복습',
          task: '단어 외우기',
          scheduledAt: '2026-05-29T20:00:00+09:00'
        });

      const response = await request(app)
        .get('/api/accessibility/review-reminders')
        .set(createAuthHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.reminders).toBeInstanceOf(Array);
      expect(response.body.reminders.length).toBe(1);
      expect(response.body.reminders[0]).toMatchObject({
        type: 'REVIEW',
        message: '영어 복습 - 단어 외우기'
      });
    });
  });
});
