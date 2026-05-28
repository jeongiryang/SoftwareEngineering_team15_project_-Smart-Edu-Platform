const { changeMyPassword, getMyUser, updateMyAccount, updateMyProfile } = require('../services/user.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const user = await getMyUser(req.user.id);

  sendSuccess(res, 200, { user });
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

module.exports = {
  getMe,
  updateMyAccount: updateMyAccountController,
  changeMyPassword: changeMyPasswordController,
  updateMyProfile: updateMyProfileController
};
