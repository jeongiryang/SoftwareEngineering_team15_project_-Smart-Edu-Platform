const prisma = require('../utils/prisma');

class NoteRepository {
  /**
   * 1. 학습 노트 생성
   * @param {Object} data - userId, title, content, subject, tags를 포함한 객체
   */
  async createNote(data) {
    return await prisma.studyNote.create({
      data,
    });
  }

  /**
   * 2. 특정 사용자의 학습 노트 목록 조회
   * @param {number} userId - 사용자 ID
   */
  async findNotesByUserId(userId) {
    return await prisma.studyNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // 최신 작성순으로 정렬
    });
  }

  /**
   * 3. 특정 학습 노트 상세 조회 (권한 검증용)
   * 타인의 노트를 조회/수정/삭제하지 못하도록 userId 조건을 함께 확인합니다.
   * @param {number} noteId - 노트 ID
   * @param {number} userId - 사용자 ID
   */
  async findNoteByIdAndUserId(noteId, userId) {
    return await prisma.studyNote.findFirst({
      where: {
        id: noteId,
        userId: userId,
      },
    });
  }

  /**
   * 4. 학습 노트 수정
   * @param {number} noteId - 수정할 노트 ID
   * @param {Object} updateData - 수정할 데이터 (title, content, subject, tags 등)
   */
  async updateNote(noteId, updateData) {
    return await prisma.studyNote.update({
      where: { id: noteId },
      data: updateData,
    });
  }

  /**
   * 5. 학습 노트 삭제
   * @param {number} noteId - 삭제할 노트 ID
   */
  async deleteNote(noteId) {
    return await prisma.studyNote.delete({
      where: { id: noteId },
    });
  }
}

module.exports = new NoteRepository();