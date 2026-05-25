const prisma = require('../utils/prisma');

function createNote(userId, data) {
  return prisma.studyNote.create({
    data: {
      userId,
      ...data
    }
  });
}

function findNotesByUserId(userId) {
  return prisma.studyNote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

function findNoteByIdAndUserId(noteId, userId) {
  return prisma.studyNote.findFirst({
    where: {
      id: noteId,
      userId
    }
  });
}

async function updateNote(noteId, userId, data) {
  const result = await prisma.studyNote.updateMany({
    where: {
      id: noteId,
      userId
    },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return findNoteByIdAndUserId(noteId, userId);
}

async function deleteNote(noteId, userId) {
  const result = await prisma.studyNote.deleteMany({
    where: {
      id: noteId,
      userId
    }
  });

  return result.count;
}

module.exports = {
  createNote,
  deleteNote,
  findNoteByIdAndUserId,
  findNotesByUserId,
  updateNote
};
