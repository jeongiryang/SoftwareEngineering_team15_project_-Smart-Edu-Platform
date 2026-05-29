const shopRepository = require('../repositories/shop.repository');
const { findUserWithProfileById, upsertUserProfile } = require('../repositories/user.repository');
const { conflictError, notFoundError, validationError } = require('../utils/errors');
const { parsePositiveInteger } = require('../utils/validators');
const { sanitizeAccount, sanitizePointTransaction } = require('./reward.service');
const { sanitizeProfile } = require('./user.service');

function sanitizeShopItem(item, options = {}) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    type: item.type,
    price: item.price,
    assetUrl: item.assetUrl,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    owned: Boolean(options.owned),
    equipped: Boolean(options.equipped)
  };
}

function sanitizeShopPurchase(purchase, options = {}) {
  return {
    id: purchase.id,
    userId: purchase.userId,
    purchasedAt: purchase.purchasedAt,
    item: sanitizeShopItem(purchase.item, options)
  };
}

function getEquippedFieldByType(type) {
  if (type === 'PROFILE_IMAGE') {
    return 'profileImageUrl';
  }

  if (type === 'PROFILE_BACKGROUND') {
    return 'profileBackgroundUrl';
  }

  if (type === 'TITLE') {
    return 'titleText';
  }

  return null;
}

function normalizeShopItemType(type) {
  const normalizedType = String(type || '').trim().toUpperCase();

  if (normalizedType === 'PROFILE_IMAGE' || normalizedType === 'PROFILE_BACKGROUND' || normalizedType === 'TITLE') {
    return normalizedType;
  }

  throw validationError('type must be one of PROFILE_IMAGE, PROFILE_BACKGROUND, TITLE', {
    field: 'type'
  });
}

function resolveAppliedValue(item) {
  if (item.type === 'TITLE') {
    return item.name;
  }

  return item.assetUrl;
}

function ensureApplicableShopItem(item) {
  if (item.type !== 'TITLE' && !item.assetUrl) {
    throw validationError('Shop item assetUrl is required for image/background items', {
      field: 'assetUrl',
      itemId: item.id
    });
  }
}

function buildEquippedItemMap(profile, purchases) {
  const equipped = {
    profileImage: null,
    profileBackground: null,
    title: null
  };

  if (!profile) {
    return equipped;
  }

  purchases.forEach((purchase) => {
    const item = purchase.item;
    const appliedValue = resolveAppliedValue(item);

    if (item.type === 'PROFILE_IMAGE' && profile.profileImageUrl && profile.profileImageUrl === appliedValue) {
      equipped.profileImage = sanitizeShopItem(item, { owned: true, equipped: true });
    }

    if (item.type === 'PROFILE_BACKGROUND' && profile.profileBackgroundUrl && profile.profileBackgroundUrl === appliedValue) {
      equipped.profileBackground = sanitizeShopItem(item, { owned: true, equipped: true });
    }

    if (item.type === 'TITLE' && profile.titleText && profile.titleText === appliedValue) {
      equipped.title = sanitizeShopItem(item, { owned: true, equipped: true });
    }
  });

  return equipped;
}

async function ensureRewardAccount(userId) {
  const account = await shopRepository.findRewardAccountByUserId(userId);

  if (account) {
    return account;
  }

  return shopRepository.createRewardAccount(userId);
}

async function getShopItems(userId) {
  const [items, purchases, user] = await Promise.all([
    shopRepository.findActiveShopItems(),
    shopRepository.findUserPurchasesByUserId(userId),
    findUserWithProfileById(userId)
  ]);

  if (!user) {
    throw notFoundError('User not found');
  }

  const ownedItemIds = new Set(purchases.map((purchase) => purchase.itemId));
  const equippedItems = buildEquippedItemMap(user.profile, purchases);
  const equippedIds = new Set(
    Object.values(equippedItems)
      .filter(Boolean)
      .map((item) => item.id)
  );

  return {
    items: items.map((item) => sanitizeShopItem(item, {
      owned: ownedItemIds.has(item.id),
      equipped: equippedIds.has(item.id)
    }))
  };
}

async function getMyShop(userId) {
  const [account, purchases, user] = await Promise.all([
    ensureRewardAccount(userId),
    shopRepository.findUserPurchasesByUserId(userId),
    findUserWithProfileById(userId)
  ]);

  if (!user) {
    throw notFoundError('User not found');
  }

  const equippedItems = buildEquippedItemMap(user.profile, purchases);

  return {
    account: sanitizeAccount(account),
    profile: sanitizeProfile(user.profile),
    equippedItems,
    purchases: purchases.map((purchase) => {
      const equippedItemIds = new Set(
        Object.values(equippedItems)
          .filter(Boolean)
          .map((item) => item.id)
      );

      return sanitizeShopPurchase(purchase, {
        owned: true,
        equipped: equippedItemIds.has(purchase.item.id)
      });
    })
  };
}

async function purchaseShopItem(userId, itemId) {
  const id = parsePositiveInteger(itemId, 'itemId');
  const item = await shopRepository.findShopItemById(id);

  if (!item || !item.isActive) {
    throw notFoundError('Shop item not found');
  }

  ensureApplicableShopItem(item);

  const result = await shopRepository.purchaseShopItem(userId, item);

  if (result.reason === 'ALREADY_PURCHASED') {
    throw conflictError('Shop item already purchased');
  }

  if (result.reason === 'INSUFFICIENT_POINTS') {
    throw conflictError('Not enough points to purchase this item');
  }

  return {
    account: sanitizeAccount(result.account),
    purchase: sanitizeShopPurchase(result.purchase, {
      owned: true,
      equipped: false
    }),
    pointTransaction: result.pointTransaction
      ? sanitizePointTransaction(result.pointTransaction)
      : null
  };
}

async function equipShopItem(userId, itemId) {
  const id = parsePositiveInteger(itemId, 'itemId');
  const [item, purchase, user] = await Promise.all([
    shopRepository.findShopItemById(id),
    shopRepository.findUserPurchaseByUserIdAndItemId(userId, id),
    findUserWithProfileById(userId)
  ]);

  if (!item || !item.isActive) {
    throw notFoundError('Shop item not found');
  }

  if (!purchase) {
    throw conflictError('Purchase the shop item before equipping it');
  }

  if (!user) {
    throw notFoundError('User not found');
  }

  ensureApplicableShopItem(item);

  const targetField = getEquippedFieldByType(item.type);
  const appliedValue = resolveAppliedValue(item);
  const profile = await upsertUserProfile(userId, {
    [targetField]: appliedValue
  });

  return {
    profile: sanitizeProfile(profile),
    equippedItem: sanitizeShopItem(item, {
      owned: true,
      equipped: true
    })
  };
}

async function unequipShopItem(userId, type) {
  const normalizedType = normalizeShopItemType(type);
  const user = await findUserWithProfileById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  const targetField = getEquippedFieldByType(normalizedType);
  const profile = await upsertUserProfile(userId, {
    [targetField]: null
  });

  return {
    profile: sanitizeProfile(profile),
    type: normalizedType
  };
}

module.exports = {
  equipShopItem,
  getMyShop,
  getShopItems,
  purchaseShopItem,
  sanitizeShopItem,
  sanitizeShopPurchase,
  unequipShopItem
};
