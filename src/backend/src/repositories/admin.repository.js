const prisma = require('../utils/prisma');

function findAllUsers() {
  return prisma.user.findMany({
    orderBy: { id: 'asc' }
  });
}

function findUserById(id) {
  return prisma.user.findUnique({
    where: { id }
  });
}

async function updateUserStatusAndLog(adminId, userId, status, reason) {
  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { status }
    });

    await tx.adminAction.create({
      data: {
        adminId,
        targetType: 'USER',
        targetId: userId,
        actionType: 'SUSPEND_USER',
        reason
      }
    });

    return updatedUser;
  });
}

function findReportedPosts() {
  return prisma.boardPost.findMany({
    where: { reported: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

function findReportedComments() {
  return prisma.comment.findMany({
    where: { reported: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      post: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

function findAdminActions() {
  return prisma.adminAction.findMany({
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

function findPostById(id) {
  return prisma.boardPost.findUnique({
    where: { id }
  });
}

async function deletePostAndLog(adminId, postId, reason) {
  return prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({
      where: { postId }
    });

    const deletedPost = await tx.boardPost.delete({
      where: { id: postId }
    });

    await tx.adminAction.create({
      data: {
        adminId,
        targetType: 'POST',
        targetId: postId,
        actionType: 'HIDE_POST',
        reason
      }
    });

    return deletedPost;
  });
}

function dismissPostReport(postId) {
  return prisma.boardPost.update({
    where: { id: postId },
    data: { reported: false }
  });
}

function findCommentById(id) {
  return prisma.comment.findUnique({
    where: { id }
  });
}

async function deleteCommentAndLog(adminId, commentId, reason) {
  return prisma.$transaction(async (tx) => {
    const deletedComment = await tx.comment.delete({
      where: { id: commentId }
    });

    await tx.adminAction.create({
      data: {
        adminId,
        targetType: 'COMMENT',
        targetId: commentId,
        actionType: 'DELETE_COMMENT',
        reason
      }
    });

    return deletedComment;
  });
}

function dismissCommentReport(commentId) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { reported: false }
  });
}

function findChallengeById(id) {
  return prisma.studyChallenge.findUnique({
    where: { id }
  });
}

async function closeChallengeAndLog(adminId, challengeId, reason) {
  return prisma.$transaction(async (tx) => {
    const updatedChallenge = await tx.studyChallenge.update({
      where: { id: challengeId },
      data: { status: 'CLOSED' }
    });

    await tx.adminAction.create({
      data: {
        adminId,
        targetType: 'CHALLENGE',
        targetId: challengeId,
        actionType: 'MODERATE_CHALLENGE',
        reason
      }
    });

    return updatedChallenge;
  });
}

module.exports = {
  findAllUsers,
  findUserById,
  updateUserStatusAndLog,
  findReportedPosts,
  findReportedComments,
  findAdminActions,
  findPostById,
  deletePostAndLog,
  dismissPostReport,
  findCommentById,
  deleteCommentAndLog,
  dismissCommentReport,
  findChallengeById,
  closeChallengeAndLog
};
