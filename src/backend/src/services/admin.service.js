const adminRepository = require('../repositories/admin.repository');
const { conflictError, notFoundError, validationError } = require('../utils/errors');
const { sanitizeUser } = require('./auth.service');
const { normalizeString, parsePositiveInteger } = require('../utils/validators');

const COMMUNITY_REPORT_STATUSES = ['PENDING', 'DISMISSED', 'RESOLVED'];
const COMMUNITY_REPORT_TARGET_TYPES = ['POST', 'COMMENT'];
const COMMUNITY_REPORT_ACTIONS = ['DISMISS', 'RESOLVE'];
const COMMUNITY_REPORT_FIELDS = ['action', 'resolutionNote'];
const COMMUNITY_REPORT_QUERY_FIELDS = ['status', 'targetType', 'page', 'pageSize'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_RESOLUTION_NOTE_LENGTH = 500;

function assertPlainObject(payload, message) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError(message);
  }
}

function assertSupportedFields(payload, supportedFields, message) {
  const unsupportedFields = Object.keys(payload).filter((field) => !supportedFields.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError(message, { fields: unsupportedFields });
  }
}

function parseOptionalPositiveInteger(value, field, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(value) || typeof value === 'object') {
    throw validationError(`${field} must be a positive integer`, { field });
  }

  return parsePositiveInteger(value, field);
}

function parseOptionalEnum(value, field, validValues) {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value) || typeof value !== 'string') {
    throw validationError(`${field} must be a string`, { field });
  }

  const normalizedValue = normalizeString(value).toUpperCase();

  if (!validValues.includes(normalizedValue)) {
    throw validationError(`Invalid ${field}. Must be one of ${validValues.join(', ')}`, { field });
  }

  return normalizedValue;
}

function buildCommunityReportListOptions(query = {}) {
  assertPlainObject(query, 'Community report query must be an object');
  assertSupportedFields(
    query,
    COMMUNITY_REPORT_QUERY_FIELDS,
    'Community report query contains unsupported fields'
  );

  const page = parseOptionalPositiveInteger(query.page, 'page', DEFAULT_PAGE);
  const pageSize = parseOptionalPositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE);

  if (pageSize > MAX_PAGE_SIZE) {
    throw validationError(`pageSize must be less than or equal to ${MAX_PAGE_SIZE}`, {
      field: 'pageSize',
      max: MAX_PAGE_SIZE
    });
  }

  return {
    page,
    pageSize,
    status: parseOptionalEnum(query.status, 'status', COMMUNITY_REPORT_STATUSES),
    targetType: parseOptionalEnum(query.targetType, 'targetType', COMMUNITY_REPORT_TARGET_TYPES)
  };
}

function buildCommunityReportProcessData(payload = {}) {
  assertPlainObject(payload, 'Community report process payload must be an object');
  assertSupportedFields(
    payload,
    COMMUNITY_REPORT_FIELDS,
    'Community report process payload contains unsupported fields'
  );

  if (!Object.prototype.hasOwnProperty.call(payload, 'action')) {
    throw validationError('action is required', { field: 'action' });
  }

  if (typeof payload.action !== 'string') {
    throw validationError('action must be a string', { field: 'action' });
  }

  const action = normalizeString(payload.action).toUpperCase();

  if (!COMMUNITY_REPORT_ACTIONS.includes(action)) {
    throw validationError(`Invalid action. Must be one of ${COMMUNITY_REPORT_ACTIONS.join(', ')}`, {
      field: 'action'
    });
  }

  if (
    payload.resolutionNote !== undefined &&
    payload.resolutionNote !== null &&
    typeof payload.resolutionNote !== 'string'
  ) {
    throw validationError('resolutionNote must be a string', { field: 'resolutionNote' });
  }

  const resolutionNote =
    payload.resolutionNote === undefined || payload.resolutionNote === null
      ? null
      : normalizeString(payload.resolutionNote);

  if (resolutionNote && resolutionNote.length > MAX_RESOLUTION_NOTE_LENGTH) {
    throw validationError(
      `resolutionNote must be less than or equal to ${MAX_RESOLUTION_NOTE_LENGTH} characters`,
      {
        field: 'resolutionNote',
        max: MAX_RESOLUTION_NOTE_LENGTH
      }
    );
  }

  return {
    action,
    status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
    resolutionNote: resolutionNote || null
  };
}

function sanitizeMinimalUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

function sanitizeCommunityReport(report) {
  if (!report) {
    return null;
  }

  return {
    id: report.id,
    reporterId: report.reporterId,
    targetType: report.targetType,
    postId: report.postId,
    commentId: report.commentId,
    reason: report.reason,
    status: report.status,
    resolvedById: report.resolvedById,
    resolvedAt: report.resolvedAt,
    resolutionNote: report.resolutionNote,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: sanitizeMinimalUser(report.reporter),
    resolvedBy: sanitizeMinimalUser(report.resolvedBy),
    post: report.post
      ? {
          id: report.post.id,
          category: report.post.category,
          title: report.post.title,
          reported: report.post.reported,
          author: sanitizeMinimalUser(report.post.user)
        }
      : null,
    comment: report.comment
      ? {
          id: report.comment.id,
          postId: report.comment.postId,
          content: report.comment.content,
          reported: report.comment.reported,
          author: sanitizeMinimalUser(report.comment.user),
          post: report.comment.post
            ? {
                id: report.comment.post.id,
                title: report.comment.post.title
              }
            : null
        }
      : null
  };
}

async function listUsers() {
  const users = await adminRepository.findAllUsers();
  return users.map(user => sanitizeUser(user));
}

async function setUserStatus(adminId, userId, status, reason) {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];
  if (!validStatuses.includes(status)) {
    throw validationError(`Invalid status. Must be one of ${validStatuses.join(', ')}`);
  }

  if (adminId === userId && ['SUSPENDED', 'DEACTIVATED'].includes(status)) {
    throw validationError('Admin cannot suspend or deactivate own account');
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
      status,
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

async function listCommunityReports(query = {}) {
  const options = buildCommunityReportListOptions(query);
  const { reports, total } = await adminRepository.findCommunityReports(options);

  return {
    reports: reports.map((report) => sanitizeCommunityReport(report)),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages: Math.ceil(total / options.pageSize)
    }
  };
}

async function processCommunityReport(adminId, reportId, payload) {
  const data = buildCommunityReportProcessData(payload);
  const report = await adminRepository.findCommunityReportById(reportId);

  if (!report) {
    throw notFoundError('Community report not found');
  }

  if (report.status !== 'PENDING') {
    throw conflictError('Community report has already been processed');
  }

  const updatedReport = await adminRepository.processCommunityReport(report, adminId, data);

  return {
    report: sanitizeCommunityReport(updatedReport),
    message: `Community report ${data.status.toLowerCase()} successfully`
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
      message: 'Post deleted by admin moderation successfully',
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
  COMMUNITY_REPORT_ACTIONS,
  COMMUNITY_REPORT_STATUSES,
  COMMUNITY_REPORT_TARGET_TYPES,
  buildCommunityReportListOptions,
  buildCommunityReportProcessData,
  listUsers,
  setUserStatus,
  listReports,
  listCommunityReports,
  processCommunityReport,
  moderateBoardPost,
  moderateComment,
  moderateChallenge
};
