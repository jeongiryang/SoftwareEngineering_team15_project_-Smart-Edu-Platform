const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { parsePositiveInteger } = require('../utils/validators');

const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.listUsers();
  sendSuccess(res, 200, { users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;
  const adminId = req.user.id;
  const targetUserId = parsePositiveInteger(userId, 'userId');

  const result = await adminService.setUserStatus(adminId, targetUserId, status, reason);
  sendSuccess(res, 200, result);
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await adminService.listReports();
  sendSuccess(res, 200, reports);
});

const listCommunityReports = asyncHandler(async (req, res) => {
  const result = await adminService.listCommunityReports(req.query);
  sendSuccess(res, 200, result);
});

const processCommunityReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const adminId = req.user.id;
  const targetReportId = parsePositiveInteger(reportId, 'reportId');

  const result = await adminService.processCommunityReport(adminId, targetReportId, req.body);
  sendSuccess(res, 200, result);
});

const listRewardBadgesController = asyncHandler(async (req, res) => {
  const result = await adminService.listRewardBadges();

  sendSuccess(res, 200, result);
});

const createRewardBadgeController = asyncHandler(async (req, res) => {
  const result = await adminService.createRewardBadge(req.body);

  sendSuccess(res, 201, result);
});

const updateRewardBadgeController = asyncHandler(async (req, res) => {
  const targetBadgeId = parsePositiveInteger(req.params.badgeId, 'badgeId');
  const result = await adminService.updateRewardBadge(targetBadgeId, req.body);

  sendSuccess(res, 200, result);
});

const listRewardQuestsController = asyncHandler(async (req, res) => {
  const result = await adminService.listRewardQuests();

  sendSuccess(res, 200, result);
});

const createRewardQuestController = asyncHandler(async (req, res) => {
  const result = await adminService.createRewardQuest(req.body);

  sendSuccess(res, 201, result);
});

const updateRewardQuestController = asyncHandler(async (req, res) => {
  const targetQuestId = parsePositiveInteger(req.params.questId, 'questId');
  const result = await adminService.updateRewardQuest(targetQuestId, req.body);

  sendSuccess(res, 200, result);
});

const moderatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;
  const targetPostId = parsePositiveInteger(postId, 'postId');

  const result = await adminService.moderateBoardPost(adminId, targetPostId, action, reason);
  sendSuccess(res, 200, result);
});

const moderateCommentController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;
  const targetCommentId = parsePositiveInteger(commentId, 'commentId');

  const result = await adminService.moderateComment(adminId, targetCommentId, action, reason);
  sendSuccess(res, 200, result);
});

const moderateChallengeController = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;
  const targetChallengeId = parsePositiveInteger(challengeId, 'challengeId');

  const result = await adminService.moderateChallenge(adminId, targetChallengeId, action, reason);
  sendSuccess(res, 200, result);
});

module.exports = {
  getUsers,
  updateUserStatus,
  getReports,
  listCommunityReports,
  processCommunityReport,
  moderatePost,
  moderateComment: moderateCommentController,
  moderateChallenge: moderateChallengeController,
  listRewardBadges: listRewardBadgesController,
  createRewardBadge: createRewardBadgeController,
  updateRewardBadge: updateRewardBadgeController,
  listRewardQuests: listRewardQuestsController,
  createRewardQuest: createRewardQuestController,
  updateRewardQuest: updateRewardQuestController
};
