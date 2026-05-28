const focusService = require('../services/focus.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const recordFocusSessionController = asyncHandler(async (req, res) => {
  const focusSession = await focusService.recordFocusSession(req.user.id, req.body);

  sendCreated(res, { focusSession });
});

const listFocusSessionsController = asyncHandler(async (req, res) => {
  const focusSessions = await focusService.listFocusSessions(req.user.id, req.query);

  sendSuccess(res, 200, { focusSessions });
});

module.exports = {
  getSessions: listFocusSessionsController,
  recordSession: recordFocusSessionController
};
