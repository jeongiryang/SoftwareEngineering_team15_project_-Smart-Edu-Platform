const prisma = require('../utils/prisma');

const USER_SHOP_PURCHASE_INCLUDE = {
  item: true
};

function createRewardAccount(userId) {
  return prisma.rewardAccount.create({
    data: {
      userId
    }
  });
}

function findRewardAccountByUserId(userId) {
  return prisma.rewardAccount.findUnique({
    where: {
      userId
    }
  });
}

function findActiveShopItems() {
  return prisma.shopItem.findMany({
    where: {
      isActive: true
    },
    orderBy: [
      { type: 'asc' },
      { price: 'asc' },
      { id: 'asc' }
    ]
  });
}

function findShopItemById(id) {
  return prisma.shopItem.findUnique({
    where: {
      id
    }
  });
}

function findUserPurchasesByUserId(userId) {
  return prisma.userShopPurchase.findMany({
    where: {
      userId
    },
    include: USER_SHOP_PURCHASE_INCLUDE,
    orderBy: {
      purchasedAt: 'desc'
    }
  });
}

function findUserPurchaseByUserIdAndItemId(userId, itemId) {
  return prisma.userShopPurchase.findFirst({
    where: {
      userId,
      itemId
    },
    include: USER_SHOP_PURCHASE_INCLUDE
  });
}

async function purchaseShopItem(userId, item) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingPurchase = await tx.userShopPurchase.findFirst({
        where: {
          userId,
          itemId: item.id
        },
        include: USER_SHOP_PURCHASE_INCLUDE
      });

      if (existingPurchase) {
        return {
          reason: 'ALREADY_PURCHASED',
          purchase: existingPurchase
        };
      }

      await tx.rewardAccount.upsert({
        where: {
          userId
        },
        update: {},
        create: {
          userId
        }
      });

      if (item.price > 0) {
        const updatedAccount = await tx.rewardAccount.updateMany({
          where: {
            userId,
            pointBalance: {
              gte: item.price
            }
          },
          data: {
            pointBalance: {
              decrement: item.price
            }
          }
        });

        if (updatedAccount.count === 0) {
          const account = await tx.rewardAccount.findUnique({
            where: {
              userId
            }
          });

          return {
            reason: 'INSUFFICIENT_POINTS',
            account
          };
        }
      }

      const purchase = await tx.userShopPurchase.create({
        data: {
          userId,
          itemId: item.id
        },
        include: USER_SHOP_PURCHASE_INCLUDE
      });

      const account = await tx.rewardAccount.findUnique({
        where: {
          userId
        }
      });

      const pointTransaction = item.price > 0
        ? await tx.pointTransaction.create({
            data: {
              userId,
              accountId: account.id,
              type: 'SPEND',
              amount: item.price,
              reason: item.name,
              sourceType: 'SHOP_ITEM',
              sourceId: item.id
            }
          })
        : null;

      return {
        reason: null,
        account,
        purchase,
        pointTransaction
      };
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      const existingPurchase = await findUserPurchaseByUserIdAndItemId(userId, item.id);

      if (existingPurchase) {
        return {
          reason: 'ALREADY_PURCHASED',
          purchase: existingPurchase
        };
      }
    }

    throw error;
  }
}

module.exports = {
  createRewardAccount,
  findActiveShopItems,
  findRewardAccountByUserId,
  findShopItemById,
  findUserPurchaseByUserIdAndItemId,
  findUserPurchasesByUserId,
  purchaseShopItem
};
