const systemService = require('../services/system.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const { broadcastRealtimeEvent } = require('../realtime/websocket.server');

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

  broadcastRealtimeEvent('maintenance.updated', { maintenance });

  sendSuccess(res, 200, { maintenance });
});

const sendAdminNotice = asyncHandler(async (req, res) => {
  const notice = systemService.buildAdminNoticePayload(req.body);

  broadcastRealtimeEvent('admin.notice', { notice });

  sendSuccess(res, 200, { notice });
});

module.exports = {
  getSystemStatus,
  getMaintenanceSetting,
  sendAdminNotice,
  updateMaintenanceSetting
};
