const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.listUsers();
  sendSuccess(res, 200, { users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;
  const adminId = req.user.id;

  const result = await adminService.setUserStatus(adminId, Number(userId), status, reason);
  sendSuccess(res, 200, result);
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await adminService.listReports();
  sendSuccess(res, 200, reports);
});

const moderatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;

  const result = await adminService.moderateBoardPost(adminId, Number(postId), action, reason);
  sendSuccess(res, 200, result);
});

const moderateCommentController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;

  const result = await adminService.moderateComment(adminId, Number(commentId), action, reason);
  sendSuccess(res, 200, result);
});

const moderateChallengeController = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { action, reason } = req.body;
  const adminId = req.user.id;

  const result = await adminService.moderateChallenge(adminId, Number(challengeId), action, reason);
  sendSuccess(res, 200, result);
});

module.exports = {
  getUsers,
  updateUserStatus,
  getReports,
  moderatePost,
  moderateComment: moderateCommentController,
  moderateChallenge: moderateChallengeController
};
