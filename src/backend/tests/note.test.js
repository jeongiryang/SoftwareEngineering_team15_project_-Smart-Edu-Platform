const request = require('supertest');
const express = require('express');
const noteRoutes = require('../src/routes/note.routes');
const noteService = require('../src/services/note.service');

// 1. Express 앱 초기화 및 라우터 연결
const app = express();
app.use(express.json());

// 2. authMiddleware 모킹 (항상 로그인된 사용자 ID: 1로 가정)
jest.mock('../src/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  }
}));

// 3. noteService 모킹
jest.mock('../src/services/note.service');

app.use('/api/notes', noteRoutes);

describe('Study Note API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/notes', () => {
    it('학습 노트를 성공적으로 생성하고 201을 반환해야 한다', async () => {
      const mockNote = { id: 1, userId: 1, title: '테스트 노트', content: '내용' };
      noteService.createNote.mockResolvedValue(mockNote);

      const response = await request(app)
        .post('/api/notes')
        .send({ title: '테스트 노트', content: '내용' });

      expect(response.status).toBe(201);
      expect(response.body.note).toEqual(mockNote);
      expect(noteService.createNote).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('GET /api/notes', () => {
    it('사용자의 학습 노트 목록을 반환해야 한다', async () => {
      const mockNotes = [{ id: 1, title: '테스트 1' }, { id: 2, title: '테스트 2' }];
      noteService.getNotesByUserId.mockResolvedValue(mockNotes);

      const response = await request(app).get('/api/notes');

      expect(response.status).toBe(200);
      expect(response.body.notes).toEqual(mockNotes);
      expect(noteService.getNotesByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /api/notes/:noteId', () => {
    it('특정 노트의 상세 정보를 반환해야 한다', async () => {
      const mockNote = { id: 1, userId: 1, title: '테스트 노트' };
      noteService.getNoteById.mockResolvedValue(mockNote);

      const response = await request(app).get('/api/notes/1');

      expect(response.status).toBe(200);
      expect(response.body.note).toEqual(mockNote);
      expect(noteService.getNoteById).toHaveBeenCalledWith(1, 1);
    });
  });
});