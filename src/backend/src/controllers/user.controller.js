const { changeMyPassword, getMyActivityStats, getMyUser, updateMyAccount, updateMyProfile } = require('../services/user.service');
const { searchFriendCandidates } = require('../services/friend.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const user = await getMyUser(req.user.id);

  sendSuccess(res, 200, { user });
});

const getMyActivityController = asyncHandler(async (req, res) => {
  const activity = await getMyActivityStats(req.user.id);

  sendSuccess(res, 200, { activity });
});

const updateMyProfileController = asyncHandler(async (req, res) => {
  const profile = await updateMyProfile(req.user.id, req.body);

  sendSuccess(res, 200, { profile });
});

const updateMyAccountController = asyncHandler(async (req, res) => {
  const user = await updateMyAccount(req.user.id, req.body);

  sendSuccess(res, 200, { user });
});

const changeMyPasswordController = asyncHandler(async (req, res) => {
  await changeMyPassword(req.user.id, req.body);

  sendSuccess(res, 200, {
    message: 'Password changed successfully'
  });
});

const searchUsersController = asyncHandler(async (req, res) => {
  const users = await searchFriendCandidates(req.user.id, req.query.keyword);

  sendSuccess(res, 200, { users });
});

module.exports = {
  getMyActivity: getMyActivityController,
  getMe,
  searchUsers: searchUsersController,
  updateMyAccount: updateMyAccountController,
  changeMyPassword: changeMyPasswordController,
  updateMyProfile: updateMyProfileController
};
