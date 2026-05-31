const prisma = require('../utils/prisma');

function findUserByLoginId(loginId) {
  return prisma.user.findUnique({
    where: { loginId }
  });
}

function findUserById(id) {
  return prisma.user.findUnique({
    where: { id }
  });
}

function findUserWithProfileById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true
    }
  });
}

function findPublicProfileById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      loginId: true,
      name: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          learningGoal: true,
          preferredSubject: true,
          profileImageUrl: true,
          profileBackgroundUrl: true,
          titleText: true
        }
      },
      shopPurchases: {
        include: {
          item: true
        },
        orderBy: {
          purchasedAt: 'desc'
        }
      }
    }
  });
}

function createUser({ loginId, name, passwordHash }) {
  return prisma.user.create({
    data: {
      loginId,
      name,
      passwordHash,
      profile: {
        create: {}
      }
    }
  });
}

function upsertUserProfile(userId, data) {
  return prisma.userProfile.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data
    }
  });
}

function updateUser(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}

function deactivateUser(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

function getStartOfToday(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  return start;
}

async function getPublicProfileLearningStats(userId) {
  const todayStart = getStartOfToday();
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);

  const [todayFocus, weeklyFocus, completedTaskCount] = await Promise.all([
    prisma.focusSession.aggregate({
      where: {
        userId,
        startedAt: {
          gte: todayStart
        }
      },
      _sum: {
        durationMs: true
      }
    }),
    prisma.focusSession.aggregate({
      where: {
        userId,
        startedAt: {
          gte: weekStart
        }
      },
      _sum: {
        durationMs: true
      }
    }),
    prisma.studyTask.count({
      where: {
        userId,
        status: 'DONE'
      }
    })
  ]);

  return {
    todayFocusMinutes: Math.round((todayFocus._sum.durationMs || 0) / 60000),
    weeklyFocusMinutes: Math.round((weeklyFocus._sum.durationMs || 0) / 60000),
    completedTaskCount
  };
}

async function getUserActivityStats(userId) {
  const [
    postCount,
    commentCount,
    replyCount,
    postLikeCount,
    postDislikeCount,
    commentLikeCount,
    commentDislikeCount,
    bookmarkCount
  ] = await Promise.all([
    prisma.boardPost.count({ where: { userId } }),
    prisma.comment.count({ where: { userId, parentId: null } }),
    prisma.comment.count({ where: { userId, parentId: { not: null } } }),
    prisma.communityReaction.count({ where: { userId, type: 'LIKE' } }),
    prisma.communityReaction.count({ where: { userId, type: 'DISLIKE' } }),
    prisma.commentReaction.count({ where: { userId, type: 'LIKE' } }),
    prisma.commentReaction.count({ where: { userId, type: 'DISLIKE' } }),
    prisma.communityBookmark.count({ where: { userId } })
  ]);

  return {
    postCount,
    commentCount,
    replyCount,
    likeCount: postLikeCount + commentLikeCount,
    dislikeCount: postDislikeCount + commentDislikeCount,
    bookmarkCount
  };
}

module.exports = {
  createUser,
  deactivateUser,
  findPublicProfileById,
  findUserByLoginId,
  findUserById,
  findUserWithProfileById,
  getPublicProfileLearningStats,
  getUserActivityStats,
  updateUser,
  updateUserPassword,
  upsertUserProfile
};
