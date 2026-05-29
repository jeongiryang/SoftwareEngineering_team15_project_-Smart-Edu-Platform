const express = require('express');
const {
  equipShopItem,
  getMyShop,
  getShopItems,
  purchaseShopItem,
  unequipShopItem
} = require('../controllers/shop.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/items', getShopItems);
router.get('/me', getMyShop);
router.post('/items/:itemId/purchase', purchaseShopItem);
router.post('/items/:itemId/equip', equipShopItem);
router.post('/unequip', unequipShopItem);

module.exports = router;
