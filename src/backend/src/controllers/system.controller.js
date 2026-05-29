const systemService = require('../services/system.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getSystemStatus = asyncHandler(async (req, res) => {
  const maintenance = await systemService.getMaintenanceSetting();

  sendSuccess(res, 200, { maintenance });
});

const getMaintenanceSetting = asyncHandler(async (req, res) => {
  const maintenance = await systemService.getMaintenanceSetting();

  sendSuccess(res, 200, { maintenance });
});

const updateMaintenanceSetting = asyncHandler(async (req, res) => {
  const maintenance = await systemService.updateMaintenanceSetting(req.body);

  sendSuccess(res, 200, { maintenance });
});

module.exports = {
  getSystemStatus,
  getMaintenanceSetting,
  updateMaintenanceSetting
};
