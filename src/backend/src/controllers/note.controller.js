const noteService = require('../services/note.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const createNoteController = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user.id, req.body);

  sendCreated(res, { note });
});

const getNotesController = asyncHandler(async (req, res) => {
  const notes = await noteService.getNotesByUserId(req.user.id);

  sendSuccess(res, 200, { notes });
});

const getNoteByIdController = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.params.noteId, req.user.id);

  sendSuccess(res, 200, { note });
});

const updateNoteController = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.params.noteId, req.user.id, req.body);

  sendSuccess(res, 200, { note });
});

const deleteNoteController = asyncHandler(async (req, res) => {
  const result = await noteService.deleteNote(req.params.noteId, req.user.id);

  sendSuccess(res, 200, result);
});

module.exports = {
  createNote: createNoteController,
  deleteNote: deleteNoteController,
  getNoteById: getNoteByIdController,
  getNotes: getNotesController,
  updateNote: updateNoteController
};
