const noteRepository = require('../repositories/note.repository');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

class NoteService {
  /**
   * 1. 학습 노트 생성
   */
  async createNote(userId, noteData) {
    const { title, content, subject, tags } = noteData;

    if (!title || !title.trim()) {
      throw new BadRequestError('노트 제목은 필수 항목입니다.');
    }
    if (!content || !content.trim()) {
      throw new BadRequestError('노트 내용은 필수 항목입니다.');
    }

    return await noteRepository.createNote({
      userId,
      title,
      content,
      subject: subject || null,
      tags: tags || [],
    });
  }

  /**
   * 2. 사용자의 학습 노트 전체 조회
   */
  async getNotesByUserId(userId) {
    return await noteRepository.findNotesByUserId(userId);
  }

  /**
   * 3. 학습 노트 상세 조회
   */
  async getNoteById(noteId, userId) {
    const note = await noteRepository.findNoteByIdAndUserId(noteId, userId);
    
    if (!note) {
      throw new NotFoundError('학습 노트를 찾을 수 없거나 접근 권한이 없습니다.');
    }
    
    return note;
  }

  /**
   * 4. 학습 노트 수정
   */
  async updateNote(noteId, userId, updateData) {
    // 수정 권한이 있는지 먼저 확인
    await this.getNoteById(noteId, userId);

    const { title, content, subject, tags } = updateData;
    const dataToUpdate = {};

    if (title !== undefined) {
      if (!title.trim()) throw new BadRequestError('노트 제목은 비워둘 수 없습니다.');
      dataToUpdate.title = title;
    }
    if (content !== undefined) {
      if (!content.trim()) throw new BadRequestError('노트 내용은 비워둘 수 없습니다.');
      dataToUpdate.content = content;
    }
    if (subject !== undefined) {
      dataToUpdate.subject = subject || null;
    }
    if (tags !== undefined) {
      dataToUpdate.tags = tags || [];
    }

    return await noteRepository.updateNote(noteId, dataToUpdate);
  }

  /**
   * 5. 학습 노트 삭제
   */
  async deleteNote(noteId, userId) {
    // 삭제 권한이 있는지 먼저 확인
    await this.getNoteById(noteId, userId);
    
    await noteRepository.deleteNote(noteId);
    return { message: '학습 노트가 성공적으로 삭제되었습니다.' };
  }
}

module.exports = new NoteService();