const prisma = require('../utils/prisma');

const publicUserSelect = {
  id: true,
  name: true,
  loginId: true,
  role: true,
  status: true,
  profile: {
    select: {
      profileImageUrl: true,
      profileBackgroundUrl: true,
      titleText: true,
      learningGoal: true,
      preferredSubject: true
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
};

const friendshipInclude = {
  requester: {
    select: publicUserSelect
  },
  addressee: {
    select: publicUserSelect
  }
};

function findUsersByKeyword(keyword, excludeUserId, take = 12) {
  return prisma.user.findMany({
    where: {
      id: {
        not: excludeUserId
      },
      status: 'ACTIVE',
      OR: [
        {
          name: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          loginId: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      ]
    },
    orderBy: [
      {
        name: 'asc'
      },
      {
        id: 'asc'
      }
    ],
    select: publicUserSelect,
    take
  });
}

function findFriendshipsWithUsers(userId, otherUserIds) {
  if (!otherUserIds.length) {
    return [];
  }

  return prisma.friendship.findMany({
    where: {
      OR: [
        {
          requesterId: userId,
          addresseeId: {
            in: otherUserIds
          }
        },
        {
          addresseeId: userId,
          requesterId: {
            in: otherUserIds
          }
        }
      ]
    },
    include: friendshipInclude
  });
}

function findFriendshipBetween(userId, otherUserId) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        {
          requesterId: userId,
          addresseeId: otherUserId
        },
        {
          requesterId: otherUserId,
          addresseeId: userId
        }
      ]
    },
    include: friendshipInclude
  });
}

function findAcceptedFriendshipBetween(userId, friendId) {
  return prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        {
          requesterId: userId,
          addresseeId: friendId
        },
        {
          requesterId: friendId,
          addresseeId: userId
        }
      ]
    },
    include: friendshipInclude
  });
}

function findFriendshipById(id) {
  return prisma.friendship.findUnique({
    where: { id },
    include: friendshipInclude
  });
}

function createFriendRequest(requesterId, addresseeId) {
  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: 'PENDING'
    },
    include: friendshipInclude
  });
}

function updateFriendship(id, data) {
  return prisma.friendship.update({
    where: { id },
    data,
    include: friendshipInclude
  });
}

function deleteFriendship(id) {
  return prisma.friendship.delete({
    where: { id },
    include: friendshipInclude
  });
}

function findAcceptedFriendshipsForUser(userId) {
  return prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userId },
        { addresseeId: userId }
      ]
    },
    include: friendshipInclude,
    orderBy: {
      updatedAt: 'desc'
    }
  });
}

function findPendingRequestsForUser(userId) {
  return prisma.friendship.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { requesterId: userId },
        { addresseeId: userId }
      ]
    },
    include: friendshipInclude,
    orderBy: {
      createdAt: 'desc'
    }
  });
}

module.exports = {
  createFriendRequest,
  deleteFriendship,
  findAcceptedFriendshipBetween,
  findAcceptedFriendshipsForUser,
  findFriendshipBetween,
  findFriendshipById,
  findFriendshipsWithUsers,
  findPendingRequestsForUser,
  findUsersByKeyword,
  publicUserSelect,
  updateFriendship
};
