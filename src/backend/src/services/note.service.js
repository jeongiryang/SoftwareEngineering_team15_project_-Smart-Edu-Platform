const {
  createNote: createNoteRecord,
  deleteNote: deleteNoteRecord,
  findNoteByIdAndUserId,
  findNotesByUserId,
  updateNote: updateNoteRecord
} = require('../repositories/note.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const NOTE_FIELDS = ['title', 'content', 'subject', 'tags'];

function assertPlainObject(payload, message) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError(message);
  }
}

function assertSupportedFields(payload, allowedFields, message) {
  const unsupportedFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError(message, { fields: unsupportedFields });
  }
}

function normalizeRequiredStringField(value, field) {
  if (typeof value !== 'string' || normalizeString(value) === '') {
    throw validationError(`${field} is required`, { field });
  }

  return normalizeString(value);
}

function normalizeOptionalStringField(value, field) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string or null`, { field });
  }

  const normalizedValue = normalizeString(value);

  return normalizedValue === '' ? null : normalizedValue;
}

function normalizeTags(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw validationError('tags must be an array of strings', { field: 'tags' });
  }

  return value.map((tag, index) => {
    if (typeof tag !== 'string' || normalizeString(tag) === '') {
      throw validationError('tags must be an array of non-empty strings', {
        field: 'tags',
        index
      });
    }

    return normalizeString(tag);
  });
}

function sanitizeNote(note) {
  if (!note) {
    return null;
  }

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    subject: note.subject,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

function buildNoteData(payload = {}, options = { partial: false }) {
  assertPlainObject(payload, 'Study note payload must be an object');
  assertSupportedFields(payload, NOTE_FIELDS, 'Study note payload contains unsupported fields');

  if (!options.partial) {
    requireFields(payload, ['title', 'content'], 'title and content are required');
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredStringField(payload.title, 'title');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'content')) {
    data.content = normalizeRequiredStringField(payload.content, 'content');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'subject')) {
    data.subject = normalizeOptionalStringField(payload.subject, 'subject');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'tags')) {
    data.tags = normalizeTags(payload.tags);
  } else if (!options.partial) {
    data.tags = [];
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Study note update requires at least one editable field', {
      fields: NOTE_FIELDS
    });
  }

  return data;
}

async function createNote(userId, payload) {
  const data = buildNoteData(payload);
  const note = await createNoteRecord(userId, data);

  return sanitizeNote(note);
}

async function getNotesByUserId(userId) {
  const notes = await findNotesByUserId(userId);

  return notes.map(sanitizeNote);
}

async function getNoteById(noteId, userId) {
  const id = parsePositiveInteger(noteId, 'noteId');
  const note = await findNoteByIdAndUserId(id, userId);

  if (!note) {
    throw notFoundError('Study note not found');
  }

  return sanitizeNote(note);
}

async function updateNote(noteId, userId, payload) {
  const id = parsePositiveInteger(noteId, 'noteId');
  const note = await findNoteByIdAndUserId(id, userId);

  if (!note) {
    throw notFoundError('Study note not found');
  }

  const data = buildNoteData(payload, { partial: true });
  const updatedNote = await updateNoteRecord(id, userId, data);

  if (!updatedNote) {
    throw notFoundError('Study note not found');
  }

  return sanitizeNote(updatedNote);
}

async function deleteNote(noteId, userId) {
  const id = parsePositiveInteger(noteId, 'noteId');
  const note = await findNoteByIdAndUserId(id, userId);

  if (!note) {
    throw notFoundError('Study note not found');
  }

  const deletedCount = await deleteNoteRecord(id, userId);

  if (deletedCount === 0) {
    throw notFoundError('Study note not found');
  }

  return { message: 'Study note deleted successfully' };
}

module.exports = {
  NOTE_FIELDS,
  buildNoteData,
  createNote,
  deleteNote,
  getNoteById,
  getNotesByUserId,
  sanitizeNote,
  updateNote
};
