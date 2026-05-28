const shopService = require('../services/shop.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getShopItems = asyncHandler(async (req, res) => {
  const result = await shopService.getShopItems(req.user.id);

  sendSuccess(res, 200, result);
});

const getMyShop = asyncHandler(async (req, res) => {
  const result = await shopService.getMyShop(req.user.id);

  sendSuccess(res, 200, { shop: result });
});

const purchaseShopItem = asyncHandler(async (req, res) => {
  const result = await shopService.purchaseShopItem(req.user.id, req.params.itemId);

  sendCreated(res, { purchase: result });
});

const equipShopItem = asyncHandler(async (req, res) => {
  const result = await shopService.equipShopItem(req.user.id, req.params.itemId);

  sendSuccess(res, 200, { equip: result });
});

module.exports = {
  equipShopItem,
  getMyShop,
  getShopItems,
  purchaseShopItem
};
