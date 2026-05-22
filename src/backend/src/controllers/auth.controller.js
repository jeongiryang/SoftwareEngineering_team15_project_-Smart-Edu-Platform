const { getCurrentUser, loginUser, registerUser } = require('../services/auth.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  sendCreated(res, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);
  sendSuccess(res, 200, result);
});

const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  sendSuccess(res, 200, { user });
});

module.exports = {
  login,
  me,
  register
};
