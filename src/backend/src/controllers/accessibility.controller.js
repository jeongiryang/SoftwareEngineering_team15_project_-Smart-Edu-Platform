const {
  createSpeechToTextTranscript,
  createTextToSpeechRequest,
  getActiveReviewReminders,
  getAccessibilityPreference,
  scheduleReviewReminder,
  updateAccessibilityPreference
} = require('../services/accessibility.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getPreferenceController = asyncHandler(async (req, res) => {
  const preference = await getAccessibilityPreference(req.user.id);
  sendSuccess(res, 200, { preference });
});

const updatePreferenceController = asyncHandler(async (req, res) => {
  const preference = await updateAccessibilityPreference(req.user.id, req.body);
  sendSuccess(res, 200, { preference });
});

const createTtsController = asyncHandler(async (req, res) => {
  const speech = await createTextToSpeechRequest(req.user.id, req.body);
  sendCreated(res, { speech });
});

const createSttController = asyncHandler(async (req, res) => {
  const speech = await createSpeechToTextTranscript(req.user.id, req.body);
  sendCreated(res, { speech });
});

const createReviewReminderController = asyncHandler(async (req, res) => {
  const reminder = await scheduleReviewReminder(req.user.id, req.body);
  sendCreated(res, { reminder });
});

const getReviewRemindersController = asyncHandler(async (req, res) => {
  const reminders = await getActiveReviewReminders(req.user.id);
  sendSuccess(res, 200, { reminders });
});

module.exports = {
  createReviewReminder: createReviewReminderController,
  getReviewReminders: getReviewRemindersController,
  createStt: createSttController,
  createTts: createTtsController,
  getPreference: getPreferenceController,
  updatePreference: updatePreferenceController
};
