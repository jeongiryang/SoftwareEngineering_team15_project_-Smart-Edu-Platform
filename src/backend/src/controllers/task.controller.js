const {
  createUserTask,
  deleteUserTask,
  listTasks,
  updateUserTask,
  updateUserTaskStatus
} = require('../services/task.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const listTaskController = asyncHandler(async (req, res) => {
  const tasks = await listTasks(req.user.id, req.query);

  sendSuccess(res, 200, { tasks });
});

const createTaskController = asyncHandler(async (req, res) => {
  const task = await createUserTask(req.user.id, req.body);

  sendCreated(res, { task });
});

const updateTaskController = asyncHandler(async (req, res) => {
  const task = await updateUserTask(req.user.id, req.params.taskId, req.body);

  sendSuccess(res, 200, { task });
});

const updateTaskStatusController = asyncHandler(async (req, res) => {
  const task = await updateUserTaskStatus(req.user.id, req.params.taskId, req.body);

  sendSuccess(res, 200, { task });
});

const deleteTaskController = asyncHandler(async (req, res) => {
  const task = await deleteUserTask(req.user.id, req.params.taskId);

  sendSuccess(res, 200, { task });
});

module.exports = {
  createTask: createTaskController,
  deleteTask: deleteTaskController,
  listTasks: listTaskController,
  updateTask: updateTaskController,
  updateTaskStatus: updateTaskStatusController
};
