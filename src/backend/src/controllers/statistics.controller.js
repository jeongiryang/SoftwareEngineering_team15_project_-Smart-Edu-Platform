const statisticsService = require('../services/statistics.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getSummaryController = asyncHandler(async (req, res) => {
  const summary = await statisticsService.getSummary(req.user.id, req.query);

  sendSuccess(res, 200, { summary });
});

const getHeatmapController = asyncHandler(async (req, res) => {
  const heatmap = await statisticsService.getHeatmapData(req.user.id, req.query);

  sendSuccess(res, 200, { heatmap });
});

module.exports = {
  getHeatmap: getHeatmapController,
  getSummary: getSummaryController
};
