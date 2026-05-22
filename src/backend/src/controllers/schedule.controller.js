const {
  createUserSchedule,
  deleteUserSchedule,
  getUserSchedule,
  listSchedules,
  updateUserSchedule
} = require('../services/schedule.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const listScheduleController = asyncHandler(async (req, res) => {
  const schedules = await listSchedules(req.user.id);

  sendSuccess(res, 200, { schedules });
});

const createScheduleController = asyncHandler(async (req, res) => {
  const schedule = await createUserSchedule(req.user.id, req.body);

  sendCreated(res, { schedule });
});

const getScheduleController = asyncHandler(async (req, res) => {
  const schedule = await getUserSchedule(req.user.id, req.params.scheduleId);

  sendSuccess(res, 200, { schedule });
});

const updateScheduleController = asyncHandler(async (req, res) => {
  const schedule = await updateUserSchedule(req.user.id, req.params.scheduleId, req.body);

  sendSuccess(res, 200, { schedule });
});

const deleteScheduleController = asyncHandler(async (req, res) => {
  const schedule = await deleteUserSchedule(req.user.id, req.params.scheduleId);

  sendSuccess(res, 200, { schedule });
});

module.exports = {
  createSchedule: createScheduleController,
  deleteSchedule: deleteScheduleController,
  getSchedule: getScheduleController,
  listSchedules: listScheduleController,
  updateSchedule: updateScheduleController
};
