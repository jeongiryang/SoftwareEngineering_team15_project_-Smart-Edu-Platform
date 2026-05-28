const adminRepository = require('../repositories/admin.repository');
const { conflictError, notFoundError, validationError } = require('../utils/errors');
const { sanitizeUser } = require('./auth.service');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const COMMUNITY_REPORT_STATUSES = ['PENDING', 'DISMISSED', 'RESOLVED'];
const COMMUNITY_REPORT_TARGET_TYPES = ['POST', 'COMMENT'];
const COMMUNITY_REPORT_ACTIONS = ['DISMISS', 'RESOLVE'];
const COMMUNITY_REPORT_FIELDS = ['action', 'resolutionNote'];
const COMMUNITY_REPORT_QUERY_FIELDS = ['status', 'targetType', 'page', 'pageSize'];
const REWARD_BADGE_FIELDS = ['code', 'name', 'description', 'iconUrl', 'condition'];
const REWARD_QUEST_FIELDS = [
  'code',
  'title',
  'description',
  'type',
  'targetValue',
  'rewardPoints',
  'badgeId',
  'isActive'
];
const REWARD_QUEST_TYPES = ['TOTAL_STUDY_MINUTES', 'TASK_COMPLETION'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_RESOLUTION_NOTE_LENGTH = 500;
const MAX_BADGE_CODE_LENGTH = 100;
const MAX_BADGE_NAME_LENGTH = 100;
const MAX_BADGE_DESCRIPTION_LENGTH = 500;
const MAX_BADGE_ICON_URL_LENGTH = 500;
const MAX_BADGE_CONDITION_LENGTH = 500;
const MAX_REWARD_QUEST_CODE_LENGTH = 100;
const MAX_REWARD_QUEST_TITLE_LENGTH = 100;
const MAX_REWARD_QUEST_DESCRIPTION_LENGTH = 500;

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

function normalizeRequiredTextField(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string`, { field });
  }

  const normalizedValue = normalizeString(value);

  if (normalizedValue === '') {
    throw validationError(`${field} is required`, { field });
  }

  if (normalizedValue.length > maxLength) {
    throw validationError(`${field} must be less than or equal to ${maxLength} characters`, {
      field,
      max: maxLength
    });
  }

  return normalizedValue;
}

function normalizeOptionalTextField(value, field, maxLength) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string or null`, { field });
  }

  const normalizedValue = normalizeString(value);

  if (normalizedValue === '') {
    return null;
  }

  if (normalizedValue.length > maxLength) {
    throw validationError(`${field} must be less than or equal to ${maxLength} characters`, {
      field,
      max: maxLength
    });
  }

  return normalizedValue;
}

function normalizeOptionalBoolean(value, field) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean`, { field });
  }

  return value;
}

function normalizeRequiredNonNegativeInteger(value, field) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw validationError(`${field} must be a non-negative integer`, { field });
  }

  return parsedValue;
}

function normalizeOptionalBadgeId(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parsePositiveInteger(value, 'badgeId');
}

function sanitizeRewardBadge(badge) {
  if (!badge) {
    return null;
  }

  return {
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    condition: badge.condition,
    createdAt: badge.createdAt,
    updatedAt: badge.updatedAt
  };
}

function sanitizeRewardQuest(quest) {
  if (!quest) {
    return null;
  }

  return {
    id: quest.id,
    code: quest.code,
    title: quest.title,
    description: quest.description,
    type: quest.type,
    targetValue: quest.targetValue,
    rewardPoints: quest.rewardPoints,
    badgeId: quest.badgeId,
    isActive: quest.isActive,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
    badge: sanitizeRewardBadge(quest.badge)
  };
}

function buildRewardBadgeData(payload = {}, { partial = false } = {}) {
  assertPlainObject(payload, 'Reward badge payload must be an object');
  assertSupportedFields(payload, REWARD_BADGE_FIELDS, 'Reward badge payload contains unsupported fields');

  if (!partial) {
    requireFields(payload, ['code', 'name'], 'code and name are required');
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'code')) {
    data.code = normalizeRequiredTextField(payload.code, 'code', MAX_BADGE_CODE_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    data.name = normalizeRequiredTextField(payload.name, 'name', MAX_BADGE_NAME_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    data.description = normalizeOptionalTextField(
      payload.description,
      'description',
      MAX_BADGE_DESCRIPTION_LENGTH
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'iconUrl')) {
    data.iconUrl = normalizeOptionalTextField(payload.iconUrl, 'iconUrl', MAX_BADGE_ICON_URL_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'condition')) {
    data.condition = normalizeOptionalTextField(
      payload.condition,
      'condition',
      MAX_BADGE_CONDITION_LENGTH
    );
  }

  if (partial && Object.keys(data).length === 0) {
    throw validationError('Reward badge update requires at least one editable field', {
      fields: REWARD_BADGE_FIELDS
    });
  }

  return data;
}

function buildRewardQuestData(payload = {}, { partial = false } = {}) {
  assertPlainObject(payload, 'Reward quest payload must be an object');
  assertSupportedFields(payload, REWARD_QUEST_FIELDS, 'Reward quest payload contains unsupported fields');

  if (!partial) {
    requireFields(payload, ['code', 'title', 'type', 'targetValue', 'rewardPoints'], 'code, title, type, targetValue, and rewardPoints are required');
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'code')) {
    data.code = normalizeRequiredTextField(payload.code, 'code', MAX_REWARD_QUEST_CODE_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredTextField(payload.title, 'title', MAX_REWARD_QUEST_TITLE_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    data.description = normalizeOptionalTextField(
      payload.description,
      'description',
      MAX_REWARD_QUEST_DESCRIPTION_LENGTH
    );
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    if (typeof payload.type !== 'string') {
      throw validationError('type must be a string', { field: 'type' });
    }

    const normalizedType = normalizeString(payload.type).toUpperCase();

    if (!REWARD_QUEST_TYPES.includes(normalizedType)) {
      throw validationError(`type must be one of ${REWARD_QUEST_TYPES.join(', ')}`, {
        field: 'type',
        allowedValues: REWARD_QUEST_TYPES
      });
    }

    data.type = normalizedType;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'targetValue')) {
    data.targetValue = normalizeRequiredNonNegativeInteger(payload.targetValue, 'targetValue');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'rewardPoints')) {
    data.rewardPoints = normalizeRequiredNonNegativeInteger(payload.rewardPoints, 'rewardPoints');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'badgeId')) {
    data.badgeId = normalizeOptionalBadgeId(payload.badgeId);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    data.isActive = normalizeOptionalBoolean(payload.isActive, 'isActive');
  }

  if (partial && Object.keys(data).length === 0) {
    throw validationError('Reward quest update requires at least one editable field', {
      fields: REWARD_QUEST_FIELDS
    });
  }

  return data;
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

async function listRewardBadges() {
  const badges = await adminRepository.findRewardBadges();

  return {
    badges: badges.map(sanitizeRewardBadge)
  };
}

async function createRewardBadge(payload) {
  const data = buildRewardBadgeData(payload);
  const existingBadge = await adminRepository.findRewardBadgeByCode(data.code);

  if (existingBadge) {
    throw conflictError('Reward badge code already exists');
  }

  const badge = await adminRepository.createRewardBadge(data);

  return {
    badge: sanitizeRewardBadge(badge)
  };
}

async function updateRewardBadge(badgeId, payload) {
  const id = parsePositiveInteger(badgeId, 'badgeId');
  const badge = await adminRepository.findRewardBadgeById(id);

  if (!badge) {
    throw notFoundError('Reward badge not found');
  }

  const data = buildRewardBadgeData(payload, { partial: true });

  if (data.code && data.code !== badge.code) {
    const existingBadge = await adminRepository.findRewardBadgeByCode(data.code);

    if (existingBadge) {
      throw conflictError('Reward badge code already exists');
    }
  }

  const updatedBadge = await adminRepository.updateRewardBadge(id, data);

  return {
    badge: sanitizeRewardBadge(updatedBadge)
  };
}

async function listRewardQuests() {
  const quests = await adminRepository.findRewardQuests();

  return {
    quests: quests.map(sanitizeRewardQuest)
  };
}

async function createRewardQuest(payload) {
  const data = buildRewardQuestData(payload);
  const existingQuest = await adminRepository.findRewardQuestByCode(data.code);

  if (existingQuest) {
    throw conflictError('Reward quest code already exists');
  }

  if (data.badgeId !== undefined && data.badgeId !== null) {
    const badge = await adminRepository.findRewardBadgeById(data.badgeId);

    if (!badge) {
      throw notFoundError('Reward badge not found');
    }
  }

  const quest = await adminRepository.createRewardQuest(data);

  return {
    quest: sanitizeRewardQuest(quest)
  };
}

async function updateRewardQuest(questId, payload) {
  const id = parsePositiveInteger(questId, 'questId');
  const quest = await adminRepository.findRewardQuestById(id);

  if (!quest) {
    throw notFoundError('Reward quest not found');
  }

  const data = buildRewardQuestData(payload, { partial: true });

  if (data.code && data.code !== quest.code) {
    const existingQuest = await adminRepository.findRewardQuestByCode(data.code);

    if (existingQuest) {
      throw conflictError('Reward quest code already exists');
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'badgeId') && data.badgeId !== null) {
    const badge = await adminRepository.findRewardBadgeById(data.badgeId);

    if (!badge) {
      throw notFoundError('Reward badge not found');
    }
  }

  const updatedQuest = await adminRepository.updateRewardQuest(id, data);

  return {
    quest: sanitizeRewardQuest(updatedQuest)
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
  moderateChallenge,
  buildRewardBadgeData,
  buildRewardQuestData,
  createRewardBadge,
  createRewardQuest,
  listRewardBadges,
  listRewardQuests,
  sanitizeRewardBadge,
  sanitizeRewardQuest,
  updateRewardBadge,
  updateRewardQuest
};
