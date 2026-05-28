const prisma = require('../utils/prisma');

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true
};

const COMMUNITY_REPORT_INCLUDE = {
  reporter: {
    select: ADMIN_USER_SELECT
  },
  resolvedBy: {
    select: ADMIN_USER_SELECT
  },
  post: {
    select: {
      id: true,
      category: true,
      title: true,
      reported: true,
      user: {
        select: ADMIN_USER_SELECT
      }
    }
  },
  comment: {
    select: {
      id: true,
      postId: true,
      content: true,
      reported: true,
      user: {
        select: ADMIN_USER_SELECT
      },
      post: {
        select: {
          id: true,
          title: true
        }
      }
    }
  }
};

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

async function findCommunityReports({ status, targetType, page, pageSize }) {
  const where = {};
  const skip = (page - 1) * pageSize;

  if (status) {
    where.status = status;
  }

  if (targetType) {
    where.targetType = targetType;
  }

  const [reports, total] = await prisma.$transaction([
    prisma.communityReport.findMany({
      where,
      include: COMMUNITY_REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.communityReport.count({ where })
  ]);

  return { reports, total };
}

function findCommunityReportById(id) {
  return prisma.communityReport.findUnique({
    where: { id },
    include: COMMUNITY_REPORT_INCLUDE
  });
}

async function processCommunityReport(report, adminId, { status, resolutionNote }) {
  return prisma.$transaction(async (tx) => {
    await tx.communityReport.update({
      where: { id: report.id },
      data: {
        status,
        resolvedById: adminId,
        resolvedAt: new Date(),
        resolutionNote
      }
    });

    if (report.targetType === 'POST' && report.postId) {
      const pendingCount = await tx.communityReport.count({
        where: {
          targetType: 'POST',
          postId: report.postId,
          status: 'PENDING'
        }
      });

      await tx.boardPost.update({
        where: { id: report.postId },
        data: { reported: pendingCount > 0 }
      });
    }

    if (report.targetType === 'COMMENT' && report.commentId) {
      const pendingCount = await tx.communityReport.count({
        where: {
          targetType: 'COMMENT',
          commentId: report.commentId,
          status: 'PENDING'
        }
      });

      await tx.comment.update({
        where: { id: report.commentId },
        data: { reported: pendingCount > 0 }
      });
    }

    return tx.communityReport.findUnique({
      where: { id: report.id },
      include: COMMUNITY_REPORT_INCLUDE
    });
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
  findCommunityReports,
  findCommunityReportById,
  processCommunityReport,
  findPostById,
  deletePostAndLog,
  dismissPostReport,
  findCommentById,
  deleteCommentAndLog,
  dismissCommentReport,
  findChallengeById,
  closeChallengeAndLog
};
