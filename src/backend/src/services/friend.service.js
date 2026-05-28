const {
  createFriendRequest,
  deleteFriendship,
  findAcceptedFriendshipBetween,
  findAcceptedFriendshipsForUser,
  findFriendshipBetween,
  findFriendshipById,
  findFriendshipsWithUsers,
  findPendingRequestsForUser,
  findUsersByKeyword,
  updateFriendship
} = require('../repositories/friend.repository');
const { findUserById } = require('../repositories/user.repository');
const { conflictError, forbiddenError, notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const REQUEST_ACTIONS = {
  ACCEPT: 'ACCEPTED',
  REJECT: 'REJECTED'
};

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

function maskEmail(email = '') {
  const [localPart] = String(email).split('@');

  if (!localPart) {
    return null;
  }

  const visible = localPart.slice(0, Math.min(3, localPart.length));
  return `${visible}${localPart.length > 3 ? '***' : ''}`;
}

function sanitizeFriendUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    status: user.status,
    emailMasked: maskEmail(user.email),
    profileImageUrl: user.profile?.profileImageUrl || null,
    learningGoal: user.profile?.learningGoal || null,
    preferredSubject: user.profile?.preferredSubject || null
  };
}

function getOtherUser(friendship, userId) {
  return friendship.requesterId === userId ? friendship.addressee : friendship.requester;
}

function getRelationshipStatus(friendship, userId) {
  if (!friendship) {
    return 'NONE';
  }

  if (friendship.status === 'ACCEPTED') {
    return 'FRIENDS';
  }

  if (friendship.status === 'PENDING') {
    return friendship.requesterId === userId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
  }

  return 'REQUEST_REJECTED';
}

function summarizeFriendship(friendship, userId) {
  return {
    id: friendship.id,
    status: friendship.status,
    direction: friendship.requesterId === userId ? 'SENT' : 'RECEIVED',
    createdAt: friendship.createdAt,
    updatedAt: friendship.updatedAt,
    user: sanitizeFriendUser(getOtherUser(friendship, userId))
  };
}

function validateSearchKeyword(keyword) {
  const normalizedKeyword = normalizeString(keyword);

  if (!normalizedKeyword) {
    throw validationError('Search keyword is required', { field: 'keyword' });
  }

  if (normalizedKeyword.length < 2) {
    throw validationError('Search keyword must be at least 2 characters', {
      field: 'keyword',
      minLength: 2
    });
  }

  if (normalizedKeyword.length > 40) {
    throw validationError('Search keyword must be 40 characters or fewer', {
      field: 'keyword',
      maxLength: 40
    });
  }

  return normalizedKeyword;
}

async function searchFriendCandidates(userId, keyword) {
  const normalizedKeyword = validateSearchKeyword(keyword);
  const users = await findUsersByKeyword(normalizedKeyword, userId);
  const friendships = await findFriendshipsWithUsers(
    userId,
    users.map((user) => user.id)
  );
  const friendshipByUserId = new Map();

  friendships.forEach((friendship) => {
    const otherUser = getOtherUser(friendship, userId);

    if (otherUser) {
      friendshipByUserId.set(otherUser.id, friendship);
    }
  });

  return users.map((user) => {
    const friendship = friendshipByUserId.get(user.id);

    return {
      ...sanitizeFriendUser(user),
      relationshipStatus: getRelationshipStatus(friendship, userId),
      friendshipId: friendship?.id || null
    };
  });
}

async function getFriends(userId) {
  const friendships = await findAcceptedFriendshipsForUser(userId);

  return friendships.map((friendship) => summarizeFriendship(friendship, userId));
}

async function getFriendRequests(userId) {
  const requests = await findPendingRequestsForUser(userId);

  return {
    received: requests
      .filter((request) => request.addresseeId === userId)
      .map((request) => summarizeFriendship(request, userId)),
    sent: requests
      .filter((request) => request.requesterId === userId)
      .map((request) => summarizeFriendship(request, userId))
  };
}

async function sendFriendRequest(userId, payload) {
  assertPlainObject(payload, 'Friend request payload must be an object');
  assertSupportedFields(payload, ['userId'], 'Friend request contains unsupported fields');
  requireFields(payload, ['userId'], 'Friend target user is required');

  const targetUserId = parsePositiveInteger(payload.userId, 'userId');

  if (targetUserId === userId) {
    throw validationError('Cannot send a friend request to yourself', { field: 'userId' });
  }

  const targetUser = await findUserById(targetUserId);

  if (!targetUser || targetUser.status !== 'ACTIVE') {
    throw notFoundError('Friend target user not found');
  }

  const existingFriendship = await findFriendshipBetween(userId, targetUserId);

  if (existingFriendship?.status === 'ACCEPTED') {
    throw conflictError('You are already friends with this user');
  }

  if (existingFriendship?.status === 'PENDING') {
    if (existingFriendship.requesterId === userId) {
      throw conflictError('Friend request is already pending');
    }

    throw conflictError('This user already sent you a friend request');
  }

  if (existingFriendship?.status === 'REJECTED') {
    const request = await updateFriendship(existingFriendship.id, {
      requesterId: userId,
      addresseeId: targetUserId,
      status: 'PENDING'
    });

    return summarizeFriendship(request, userId);
  }

  const request = await createFriendRequest(userId, targetUserId);

  return summarizeFriendship(request, userId);
}

async function respondToFriendRequest(userId, requestId, payload) {
  assertPlainObject(payload, 'Friend request response payload must be an object');
  assertSupportedFields(payload, ['action'], 'Friend request response contains unsupported fields');
  requireFields(payload, ['action'], 'Friend request action is required');

  const friendshipId = parsePositiveInteger(requestId, 'requestId');
  const action = normalizeString(payload.action)?.toUpperCase();
  const nextStatus = REQUEST_ACTIONS[action];

  if (!nextStatus) {
    throw validationError('Friend request action must be ACCEPT or REJECT', { field: 'action' });
  }

  const friendship = await findFriendshipById(friendshipId);

  if (!friendship) {
    throw notFoundError('Friend request not found');
  }

  if (friendship.addresseeId !== userId) {
    throw forbiddenError('Only the request addressee can respond to this friend request');
  }

  if (friendship.status !== 'PENDING') {
    throw conflictError('Friend request has already been processed');
  }

  const updatedFriendship = await updateFriendship(friendship.id, {
    status: nextStatus
  });

  return summarizeFriendship(updatedFriendship, userId);
}

async function removeFriend(userId, friendId) {
  const targetUserId = parsePositiveInteger(friendId, 'friendId');
  const friendship = await findAcceptedFriendshipBetween(userId, targetUserId);

  if (!friendship) {
    throw notFoundError('Friend relationship not found');
  }

  const deletedFriendship = await deleteFriendship(friendship.id);

  return summarizeFriendship(deletedFriendship, userId);
}

module.exports = {
  REQUEST_ACTIONS,
  getFriends,
  getFriendRequests,
  getRelationshipStatus,
  removeFriend,
  sanitizeFriendUser,
  searchFriendCandidates,
  sendFriendRequest,
  summarizeFriendship,
  respondToFriendRequest
};
