const { getMyUser, updateMyProfile } = require('../services/user.service');
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

module.exports = {
  getMe,
  updateMyProfile: updateMyProfileController
};
