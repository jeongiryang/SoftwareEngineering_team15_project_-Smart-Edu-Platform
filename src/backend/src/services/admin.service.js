const adminRepository = require('../repositories/admin.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { sanitizeUser } = require('./auth.service');

async function listUsers() {
  const users = await adminRepository.findAllUsers();
  return users.map(user => sanitizeUser(user));
}

async function setUserStatus(adminId, userId, status, reason) {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];
  if (!validStatuses.includes(status)) {
    throw validationError(`Invalid status. Must be one of ${validStatuses.join(', ')}`);
  }

  const user = await adminRepository.findUserById(userId);
  if (!user) {
    throw notFoundError('User not found');
  }

  const updatedUser = await adminRepository.updateUserStatusAndLog(adminId, userId, status, reason);
  return {
    user: sanitizeUser(updatedUser),
    action: {
      adminId,
      targetType: 'USER',
      targetId: userId,
      actionType: 'SUSPEND_USER',
      reason
    }
  };
}

async function listReports() {
  const reportedPosts = await adminRepository.findReportedPosts();
  const reportedComments = await adminRepository.findReportedComments();
  const adminActions = await adminRepository.findAdminActions();

  return {
    reportedPosts,
    reportedComments,
    adminActions
  };
}

async function moderateBoardPost(adminId, postId, action, reason) {
  const validActions = ['HIDE', 'KEEP'];
  if (!validActions.includes(action)) {
    throw validationError(`Invalid action. Must be one of ${validActions.join(', ')}`);
  }

  const post = await adminRepository.findPostById(postId);
  if (!post) {
    throw notFoundError('Post not found');
  }

  if (action === 'HIDE') {
    await adminRepository.deletePostAndLog(adminId, postId, reason);
    return {
      message: 'Post moderated and hidden successfully',
      action: {
        adminId,
        targetType: 'POST',
        targetId: postId,
        actionType: 'HIDE_POST',
        reason
      }
    };
  } else {
    const updatedPost = await adminRepository.dismissPostReport(postId);
    return {
      post: updatedPost,
      message: 'Post report dismissed',
    };
  }
}

async function moderateComment(adminId, commentId, action, reason) {
  const validActions = ['DELETE', 'KEEP'];
  if (!validActions.includes(action)) {
    throw validationError(`Invalid action. Must be one of ${validActions.join(', ')}`);
  }

  const comment = await adminRepository.findCommentById(commentId);
  if (!comment) {
    throw notFoundError('Comment not found');
  }

  if (action === 'DELETE') {
    await adminRepository.deleteCommentAndLog(adminId, commentId, reason);
    return {
      message: 'Comment deleted successfully',
      action: {
        adminId,
        targetType: 'COMMENT',
        targetId: commentId,
        actionType: 'DELETE_COMMENT',
        reason
      }
    };
  } else {
    const updatedComment = await adminRepository.dismissCommentReport(commentId);
    return {
      comment: updatedComment,
      message: 'Comment report dismissed',
    };
  }
}

async function moderateChallenge(adminId, challengeId, action, reason) {
  const validActions = ['CLOSE'];
  if (!validActions.includes(action)) {
    throw validationError(`Invalid action. Must be one of ${validActions.join(', ')}`);
  }

  const challenge = await adminRepository.findChallengeById(challengeId);
  if (!challenge) {
    throw notFoundError('Challenge not found');
  }

  const updatedChallenge = await adminRepository.closeChallengeAndLog(adminId, challengeId, reason);
  return {
    challenge: updatedChallenge,
    message: 'Challenge closed successfully',
    action: {
      adminId,
      targetType: 'CHALLENGE',
      targetId: challengeId,
      actionType: 'MODERATE_CHALLENGE',
      reason
    }
  };
}

module.exports = {
  listUsers,
  setUserStatus,
  listReports,
  moderateBoardPost,
  moderateComment,
  moderateChallenge
};
