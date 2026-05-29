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
  findUserByLoginId,
  findUserById,
  findUserWithProfileById,
  getUserActivityStats,
  updateUser,
  updateUserPassword,
  upsertUserProfile
};
