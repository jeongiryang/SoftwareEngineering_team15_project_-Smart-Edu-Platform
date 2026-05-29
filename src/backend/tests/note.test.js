const mockUsers = [];
const mockNotes = [];
let mockNextUserId = 1;
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

jest.mock('../src/repositories/note.repository', () => ({
  createNote: jest.fn(async (userId, data) => {
    const now = new Date();
    const note = {
      id: mockNextNoteId,
      userId,
      subject: null,
      tags: [],
      ...data,
      createdAt: now,
      updatedAt: now
    };

    mockNextNoteId += 1;
    mockNotes.push(note);

    return note;
  }),
  deleteNote: jest.fn(async (id, userId) => {
    const index = mockNotes.findIndex(
      (note) => note.id === Number(id) && note.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockNotes.splice(index, 1);

    return 1;
  }),
  findNoteByIdAndUserId: jest.fn(async (id, userId) => mockNotes.find(
    (note) => note.id === Number(id) && note.userId === Number(userId)
  ) || null),
  findNotesByUserId: jest.fn(async (userId) => mockNotes
    .filter((note) => note.userId === Number(userId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())),
  updateNote: jest.fn(async (id, userId, data) => {
    const note = mockNotes.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    if (!note) {
      return null;
    }

    Object.assign(note, data, { updatedAt: new Date() });

    return note;
  })
}));

const request = require('supertest');
const app = require('../src/app');
const noteRepository = require('../src/repositories/note.repository');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

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

async function createTestNote(token, overrides = {}) {
  const response = await request(app)
    .post('/api/notes')
    .set(createAuthHeader(token))
    .send({
      title: '  English grammar  ',
      content: '  Past tense summary  ',
      subject: 'English',
      tags: ['grammar', 'review'],
      ...overrides
    });

  return response.body.note;
}

function expectSafeNotePayload(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockNotes.length = 0;
  mockNextUserId = 1;
  mockNextNoteId = 1;
  jest.clearAllMocks();
});

describe('Study Note API', () => {
  it('rejects unauthenticated note requests', async () => {
    const response = await request(app).get('/api/notes');

    expect(response.status).toBe(401);
  });

  it('creates a note for the current user without sensitive fields', async () => {
    const { token, user } = await registerTestUser();

    const response = await request(app)
      .post('/api/notes')
      .set(createAuthHeader(token))
      .send({
        title: '  Math note  ',
        content: '  Linear equation summary  ',
        subject: 'Math',
        tags: ['algebra', 'review']
      });

    expect(response.status).toBe(201);
    expect(response.body.note).toEqual(
      expect.objectContaining({
        userId: user.id,
        title: 'Math note',
        content: 'Linear equation summary',
        subject: 'Math',
        tags: ['algebra', 'review']
      })
    );
    expectSafeNotePayload(response.body);
  });

  it('rejects note creation when required fields are missing', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/notes')
      .set(createAuthHeader(token))
      .send({
        title: ' '
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unsupported tags payloads', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/notes')
      .set(createAuthHeader(token))
      .send({
        title: 'Math',
        content: 'Formula notes',
        tags: 'math'
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('lists and reads only the current user notes', async () => {
    const { token } = await registerTestUser();
    const { token: otherToken } = await registerTestUser();
    const note = await createTestNote(token);
    await createTestNote(otherToken, {
      title: 'Other user note',
      content: 'Private content'
    });

    const listResponse = await request(app)
      .get('/api/notes')
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.notes).toHaveLength(1);
    expect(listResponse.body.notes[0].id).toBe(note.id);
    expectSafeNotePayload(listResponse.body);

    const detailResponse = await request(app)
      .get(`/api/notes/${note.id}`)
      .set(createAuthHeader(token));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.note.id).toBe(note.id);
    expectSafeNotePayload(detailResponse.body);
  });

  it('updates a note owned by the current user', async () => {
    const { token } = await registerTestUser();
    const note = await createTestNote(token);

    const response = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set(createAuthHeader(token))
      .send({
        title: '  Updated title  ',
        content: 'Updated content',
        subject: null,
        tags: ['updated']
      });

    expect(response.status).toBe(200);
    expect(response.body.note).toEqual(
      expect.objectContaining({
        id: note.id,
        title: 'Updated title',
        content: 'Updated content',
        subject: null,
        tags: ['updated']
      })
    );
  });

  it('rejects empty note update payloads', async () => {
    const { token } = await registerTestUser();
    const note = await createTestNote(token);

    const response = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('deletes a note and returns 404 when it is read again', async () => {
    const { token } = await registerTestUser();
    const note = await createTestNote(token);

    const deleteResponse = await request(app)
      .delete(`/api/notes/${note.id}`)
      .set(createAuthHeader(token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Study note deleted successfully'
    });

    const detailResponse = await request(app)
      .get(`/api/notes/${note.id}`)
      .set(createAuthHeader(token));

    expect(detailResponse.status).toBe(404);
  });

  it.each(['abc', '0', '-1'])('rejects invalid noteId "%s"', async (noteId) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get(`/api/notes/${noteId}`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for nonexistent notes', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/notes/999999')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('blocks other users from reading, updating, or deleting a note', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser();
    const note = await createTestNote(ownerToken);

    const readResponse = await request(app)
      .get(`/api/notes/${note.id}`)
      .set(createAuthHeader(otherToken));

    expect(readResponse.status).toBe(404);

    const updateResponse = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set(createAuthHeader(otherToken))
      .send({
        title: 'Unauthorized update'
      });

    expect(updateResponse.status).toBe(404);
    expect(noteRepository.updateNote).not.toHaveBeenCalledWith(
      note.id,
      expect.any(Number),
      expect.any(Object)
    );

    const deleteResponse = await request(app)
      .delete(`/api/notes/${note.id}`)
      .set(createAuthHeader(otherToken));

    expect(deleteResponse.status).toBe(404);
    expect(noteRepository.deleteNote).not.toHaveBeenCalledWith(note.id, expect.any(Number));

    const ownerReadResponse = await request(app)
      .get(`/api/notes/${note.id}`)
      .set(createAuthHeader(ownerToken));

    expect(ownerReadResponse.status).toBe(200);
    expect(ownerReadResponse.body.note.title).toBe(note.title);
  });
});
