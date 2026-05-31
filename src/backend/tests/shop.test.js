const mockUsers = [];
const mockProfiles = new Map();
const mockRewardAccounts = new Map();
const mockShopItems = [
  {
    id: 1,
    code: 'PROFILE_AVATAR_SKY',
    name: '하늘 연필 아바타',
    description: '밝은 하늘색 톤의 프로필 이미지를 적용합니다.',
    type: 'PROFILE_IMAGE',
    price: 15,
    assetUrl: '/assets/shop/avatar-sky.png',
    isActive: true,
    createdAt: new Date('2026-05-28T10:00:00.000Z'),
    updatedAt: new Date('2026-05-28T10:00:00.000Z')
  },
  {
    id: 2,
    code: 'PROFILE_BACKGROUND_DAWN',
    name: '새벽 학습 배경',
    description: '잔잔한 새벽 톤 배경을 프로필에 적용합니다.',
    type: 'PROFILE_BACKGROUND',
    price: 25,
    assetUrl: '/assets/shop/background-dawn.png',
    isActive: true,
    createdAt: new Date('2026-05-28T10:00:00.000Z'),
    updatedAt: new Date('2026-05-28T10:00:00.000Z')
  },
  {
    id: 3,
    code: 'TITLE_EARLY_BIRD',
    name: '아침형 학습러',
    description: '일찍 시작하는 학습자용 칭호입니다.',
    type: 'TITLE',
    price: 10,
    assetUrl: null,
    isActive: true,
    createdAt: new Date('2026-05-28T10:00:00.000Z'),
    updatedAt: new Date('2026-05-28T10:00:00.000Z')
  }
];
const mockPurchases = [];
let mockNextUserId = 1;
let mockNextProfileId = 1;
let mockNextAccountId = 1;
let mockNextPurchaseId = 1;
let mockNextPointTransactionId = 1;

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ loginId, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      loginId,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };

    mockNextUserId += 1;
    mockUsers.push(user);
    mockProfiles.set(user.id, {
      id: mockNextProfileId,
      userId: user.id,
      learningGoal: null,
      preferredSubject: null,
      profileImageUrl: null,
      profileBackgroundUrl: null,
      titleText: null,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });
    mockNextProfileId += 1;

    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null),
  findUserWithProfileById: jest.fn(async (id) => {
    const user = mockUsers.find((item) => item.id === Number(id));

    if (!user) {
      return null;
    }

    return {
      ...user,
      profile: mockProfiles.get(user.id) || null
    };
  }),
  upsertUserProfile: jest.fn(async (userId, data) => {
    const existingProfile = mockProfiles.get(Number(userId));
    const profile = {
      id: existingProfile?.id || mockNextProfileId,
      userId: Number(userId),
      learningGoal: existingProfile?.learningGoal || null,
      preferredSubject: existingProfile?.preferredSubject || null,
      profileImageUrl: existingProfile?.profileImageUrl || null,
      profileBackgroundUrl: existingProfile?.profileBackgroundUrl || null,
      titleText: existingProfile?.titleText || null,
      createdAt: existingProfile?.createdAt || new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T11:00:00.000Z'),
      ...data
    };

    if (!existingProfile) {
      mockNextProfileId += 1;
    }

    mockProfiles.set(Number(userId), profile);

    return profile;
  })
}));

jest.mock('../src/repositories/shop.repository', () => ({
  createRewardAccount: jest.fn(async (userId) => {
    const account = {
      id: mockNextAccountId,
      userId,
      pointBalance: 0,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    };
    mockNextAccountId += 1;
    mockRewardAccounts.set(userId, account);
    return account;
  }),
  findRewardAccountByUserId: jest.fn(async (userId) => mockRewardAccounts.get(Number(userId)) || null),
  findActiveShopItems: jest.fn(async () =>
    mockShopItems
      .filter((item) => item.isActive)
      .slice()
      .sort((left, right) => left.id - right.id)
  ),
  findShopItemById: jest.fn(async (id) => mockShopItems.find((item) => item.id === Number(id)) || null),
  findUserPurchasesByUserId: jest.fn(async (userId) =>
    mockPurchases
      .filter((purchase) => purchase.userId === Number(userId))
      .map((purchase) => ({
        ...purchase,
        item: mockShopItems.find((item) => item.id === purchase.itemId)
      }))
      .sort((left, right) => right.purchasedAt.getTime() - left.purchasedAt.getTime())
  ),
  findUserPurchaseByUserIdAndItemId: jest.fn(async (userId, itemId) => {
    const purchase = mockPurchases.find((entry) => entry.userId === Number(userId) && entry.itemId === Number(itemId));

    if (!purchase) {
      return null;
    }

    return {
      ...purchase,
      item: mockShopItems.find((item) => item.id === purchase.itemId)
    };
  }),
  purchaseShopItem: jest.fn(async (userId, item) => {
    const existingPurchase = mockPurchases.find((entry) => entry.userId === Number(userId) && entry.itemId === item.id);

    if (existingPurchase) {
      return {
        reason: 'ALREADY_PURCHASED',
        purchase: {
          ...existingPurchase,
          item
        }
      };
    }

    let account = mockRewardAccounts.get(Number(userId));

    if (!account) {
      account = {
        id: mockNextAccountId,
        userId: Number(userId),
        pointBalance: 0,
        createdAt: new Date('2026-05-28T10:00:00.000Z'),
        updatedAt: new Date('2026-05-28T10:00:00.000Z')
      };
      mockNextAccountId += 1;
      mockRewardAccounts.set(Number(userId), account);
    }

    if (account.pointBalance < item.price) {
      return {
        reason: 'INSUFFICIENT_POINTS',
        account
      };
    }

    account = {
      ...account,
      pointBalance: account.pointBalance - item.price,
      updatedAt: new Date('2026-05-28T11:00:00.000Z')
    };
    mockRewardAccounts.set(Number(userId), account);

    const purchase = {
      id: mockNextPurchaseId,
      userId: Number(userId),
      itemId: item.id,
      purchasedAt: new Date(`2026-05-28T11:00:0${mockNextPurchaseId}.000Z`)
    };
    mockNextPurchaseId += 1;
    mockPurchases.push(purchase);

    return {
      reason: null,
      account,
      purchase: {
        ...purchase,
        item
      },
      pointTransaction: {
        id: mockNextPointTransactionId++,
        userId: Number(userId),
        accountId: account.id,
        type: 'SPEND',
        amount: item.price,
        reason: item.name,
        sourceType: 'SHOP_ITEM',
        sourceId: item.id,
        createdAt: new Date('2026-05-28T11:00:00.000Z')
      }
    };
  })
}));

const request = require('supertest');
const app = require('../src/app');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    response,
    token: response.body.token,
    user: response.body.user
  };
}

beforeEach(() => {
  mockUsers.length = 0;
  mockProfiles.clear();
  mockRewardAccounts.clear();
  mockPurchases.length = 0;
  mockNextUserId = 1;
  mockNextProfileId = 1;
  mockNextAccountId = 1;
  mockNextPurchaseId = 1;
  mockNextPointTransactionId = 1;
  jest.clearAllMocks();
});

describe('shop API', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/shop/items');

    expect(response.status).toBe(401);
  });

  it('returns active shop items with ownership and equipped state', async () => {
    const { token, user } = await registerTestUser();

    mockRewardAccounts.set(user.id, {
      id: 1,
      userId: user.id,
      pointBalance: 50,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });
    mockProfiles.set(user.id, {
      ...mockProfiles.get(user.id),
      titleText: '아침형 학습러'
    });
    mockPurchases.push({
      id: 1,
      userId: user.id,
      itemId: 3,
      purchasedAt: new Date('2026-05-28T10:30:00.000Z')
    });

    const response = await request(app)
      .get('/api/shop/items')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items.find((item) => item.code === 'TITLE_EARLY_BIRD')).toEqual(
      expect.objectContaining({
        owned: true,
        equipped: true
      })
    );
    expect(response.body.items.find((item) => item.code === 'PROFILE_AVATAR_SKY')).toEqual(
      expect.objectContaining({
        owned: false,
        equipped: false
      })
    );
  });

  it('purchases a shop item and deducts points', async () => {
    const { token, user } = await registerTestUser();

    mockRewardAccounts.set(user.id, {
      id: 1,
      userId: user.id,
      pointBalance: 40,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });

    const response = await request(app)
      .post('/api/shop/items/1/purchase')
      .set(createAuthHeader(token));

    expect(response.status).toBe(201);
    expect(response.body.purchase.account.pointBalance).toBe(25);
    expect(response.body.purchase.purchase.item.code).toBe('PROFILE_AVATAR_SKY');
    expect(response.body.purchase.pointTransaction).toEqual(
      expect.objectContaining({
        type: 'SPEND',
        amount: 15,
        sourceType: 'SHOP_ITEM'
      })
    );
  });

  it('rejects duplicate purchases for the same shop item', async () => {
    const { token, user } = await registerTestUser();

    mockRewardAccounts.set(user.id, {
      id: 1,
      userId: user.id,
      pointBalance: 40,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });

    const firstResponse = await request(app)
      .post('/api/shop/items/1/purchase')
      .set(createAuthHeader(token));
    const secondResponse = await request(app)
      .post('/api/shop/items/1/purchase')
      .set(createAuthHeader(token));

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.message).toBe('Shop item already purchased');
  });

  it('rejects purchases when the user does not have enough points', async () => {
    const { token, user } = await registerTestUser();

    mockRewardAccounts.set(user.id, {
      id: 1,
      userId: user.id,
      pointBalance: 5,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });

    const response = await request(app)
      .post('/api/shop/items/2/purchase')
      .set(createAuthHeader(token));

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Not enough points to purchase this item');
  });

  it('rejects equip requests before purchase', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/shop/items/1/equip')
      .set(createAuthHeader(token));

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Purchase the shop item before equipping it');
  });

  it('equips a purchased item and exposes the applied profile state', async () => {
    const { token, user } = await registerTestUser();

    mockRewardAccounts.set(user.id, {
      id: 1,
      userId: user.id,
      pointBalance: 40,
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      updatedAt: new Date('2026-05-28T10:00:00.000Z')
    });
    mockPurchases.push({
      id: 1,
      userId: user.id,
      itemId: 2,
      purchasedAt: new Date('2026-05-28T10:30:00.000Z')
    });

    const equipResponse = await request(app)
      .post('/api/shop/items/2/equip')
      .set(createAuthHeader(token));

    expect(equipResponse.status).toBe(200);
    expect(equipResponse.body.equip.profile.profileBackgroundUrl).toBe('/assets/shop/background-dawn.png');
    expect(equipResponse.body.equip.equippedItem.code).toBe('PROFILE_BACKGROUND_DAWN');

    const myShopResponse = await request(app)
      .get('/api/shop/me')
      .set(createAuthHeader(token));

    expect(myShopResponse.status).toBe(200);
    expect(myShopResponse.body.shop.profile.profileBackgroundUrl).toBe('/assets/shop/background-dawn.png');
    expect(myShopResponse.body.shop.equippedItems.profileBackground).toEqual(
      expect.objectContaining({
        code: 'PROFILE_BACKGROUND_DAWN'
      })
    );
  });

  it('unequips an equipped item and restores the default state', async () => {
    const { token, user } = await registerTestUser();

    mockProfiles.set(user.id, {
      ...mockProfiles.get(user.id),
      profileBackgroundUrl: '/assets/shop/background-dawn.png'
    });
    mockPurchases.push({
      id: 1,
      userId: user.id,
      itemId: 2,
      purchasedAt: new Date('2026-05-28T10:30:00.000Z')
    });

    const response = await request(app)
      .post('/api/shop/unequip')
      .set(createAuthHeader(token))
      .send({ type: 'PROFILE_BACKGROUND' });

    expect(response.status).toBe(200);
    expect(response.body.unequip.type).toBe('PROFILE_BACKGROUND');
    expect(response.body.unequip.profile.profileBackgroundUrl).toBeNull();

    const myShopResponse = await request(app)
      .get('/api/shop/me')
      .set(createAuthHeader(token));

    expect(myShopResponse.status).toBe(200);
    expect(myShopResponse.body.shop.profile.profileBackgroundUrl).toBeNull();
    expect(myShopResponse.body.shop.equippedItems.profileBackground).toBeNull();
  });

  it('validates unequip type and does not expose password hashes', async () => {
    const { token, user } = await registerTestUser();

    mockPurchases.push({
      id: 1,
      userId: user.id,
      itemId: 3,
      purchasedAt: new Date('2026-05-28T10:30:00.000Z')
    });

    const invalidResponse = await request(app)
      .post('/api/shop/unequip')
      .set(createAuthHeader(token))
      .send({ type: 'UNKNOWN' });
    const myShopResponse = await request(app)
      .get('/api/shop/me')
      .set(createAuthHeader(token));

    expect(invalidResponse.status).toBe(400);
    expect(JSON.stringify(myShopResponse.body)).not.toContain('passwordHash');
    expect(JSON.stringify(myShopResponse.body)).not.toContain('password123');
  });
});
