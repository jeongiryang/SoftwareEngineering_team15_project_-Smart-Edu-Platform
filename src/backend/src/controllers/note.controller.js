const noteService = require('../services/note.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

// 1. 학습 노트 생성 컨트롤러
const createNoteController = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user.id, req.body);
  sendCreated(res, { note });
});

// 2. 학습 노트 전체 목록 조회 컨트롤러
const getNotesController = asyncHandler(async (req, res) => {
  const notes = await noteService.getNotesByUserId(req.user.id);
  sendSuccess(res, 200, { notes });
});

// 3. 특정 학습 노트 상세 조회 컨트롤러
const getNoteByIdController = asyncHandler(async (req, res) => {
  // 파라미터로 넘어온 ID를 정수로 변환하여 전달
  const noteId = parseInt(req.params.noteId, 10);
  const note = await noteService.getNoteById(noteId, req.user.id);
  sendSuccess(res, 200, { note });
});

// 4. 학습 노트 수정 컨트롤러
const updateNoteController = asyncHandler(async (req, res) => {
  const noteId = parseInt(req.params.noteId, 10);
  const note = await noteService.updateNote(noteId, req.user.id, req.body);
  sendSuccess(res, 200, { note });
});

// 5. 학습 노트 삭제 컨트롤러
const deleteNoteController = asyncHandler(async (req, res) => {
  const noteId = parseInt(req.params.noteId, 10);
  const result = await noteService.deleteNote(noteId, req.user.id);
  sendSuccess(res, 200, result); // result 안에 { message: "..." }가 들어있음
});

module.exports = {
  createNote: createNoteController,
  getNotes: getNotesController,
  getNoteById: getNoteByIdController,
  updateNote: updateNoteController,
  deleteNote: deleteNoteController
};