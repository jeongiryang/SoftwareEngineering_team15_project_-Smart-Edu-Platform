const mockUsers = [];
let mockNextUserId = 1;

const mockRewardAccount = {
  id: 1,
  userId: 1,
  pointBalance: 120,
  createdAt: new Date('2026-05-28T00:00:00Z'),
  updatedAt: new Date('2026-05-28T00:00:00Z')
};

const mockBadge = {
  id: 1,
  code: 'TOTAL_STUDY_60',
  name: '60분 집중 학습',
  description: '누적 60분 이상 공부하면 획득',
  iconUrl: '/assets/badges/total-study-60.png',
  condition: 'TOTAL_STUDY_MINUTES >= 60',
  createdAt: new Date('2026-05-28T00:00:00Z'),
  updatedAt: new Date('2026-05-28T00:00:00Z')
};

const mockQuest = {
  id: 1,
  code: 'TOTAL_STUDY_60',
  title: '누적 60분 공부하기',
  description: '집중 학습 시간을 누적 60분 이상 기록하세요.',
  type: 'TOTAL_STUDY_MINUTES',
  targetValue: 60,
  rewardPoints: 50,
  badgeId: 1,
  isActive: true,
  createdAt: new Date('2026-05-28T00:00:00Z'),
  updatedAt: new Date('2026-05-28T00:00:00Z'),
  badge: mockBadge
};

function mockBuildUserQuest(overrides = {}) {
  return {
    id: 1,
    userId: 1,
    questId: mockQuest.id,
    progressValue: 60,
    status: 'ACHIEVED',
    achievedAt: new Date('2026-05-28T01:00:00Z'),
    claimedAt: null,
    createdAt: new Date('2026-05-28T00:00:00Z'),
    updatedAt: new Date('2026-05-28T01:00:00Z'),
    quest: mockQuest,
    ...overrides
  };
}

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ email, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      email,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };

    mockNextUserId += 1;
    mockUsers.push(user);

    return user;
  }),
  findUserByEmail: jest.fn(async (email) => mockUsers.find((user) => user.email === email) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/reward.repository', () => ({
  claimQuestReward: jest.fn(async (userId, userQuest) => ({
    account: {
      ...mockRewardAccount,
      userId,
      pointBalance: mockRewardAccount.pointBalance + userQuest.quest.rewardPoints
    },
    pointTransaction: {
      id: 1,
      userId,
      accountId: mockRewardAccount.id,
      type: 'EARN',
      amount: userQuest.quest.rewardPoints,
      reason: userQuest.quest.title,
      sourceType: 'REWARD_QUEST',
      sourceId: userQuest.questId,
      createdAt: new Date('2026-05-28T02:00:00Z')
    },
    userBadge: {
      id: 1,
      userId,
      badgeId: mockBadge.id,
      badge: mockBadge,
      achievedAt: new Date('2026-05-28T02:00:00Z')
    },
    userQuest: mockBuildUserQuest({
      userId,
      status: 'CLAIMED',
      claimedAt: new Date('2026-05-28T02:00:00Z')
    })
  })),
  createRewardAccount: jest.fn(async (userId) => ({
    ...mockRewardAccount,
    userId,
    pointBalance: 0
  })),
  findActiveQuests: jest.fn(async () => [mockQuest]),
  findRecentPointTransactionsByUserId: jest.fn(async () => []),
  findRewardAccountByUserId: jest.fn(async (userId) => ({
    ...mockRewardAccount,
    userId
  })),
  findUserBadgesByUserId: jest.fn(async (userId) => [
    {
      id: 1,
      userId,
      badgeId: mockBadge.id,
      badge: mockBadge,
      achievedAt: new Date('2026-05-28T02:00:00Z')
    }
  ]),
  findUserQuestByUserIdAndQuestId: jest.fn(async (userId, questId) =>
    questId === mockQuest.id ? mockBuildUserQuest({ userId }) : null
  ),
  findUserQuestsByUserId: jest.fn(async () => []),
  getRewardMetrics: jest.fn(async () => ({
    totalStudyMinutes: 60,
    completedTaskCount: 1
  })),
  upsertUserQuestProgress: jest.fn(async (userId, questId, data) =>
    mockBuildUserQuest({
      userId,
      questId,
      ...data
    })
  )
}));

const request = require('supertest');
const app = require('../src/app');
const rewardRepository = require('../src/repositories/reward.repository');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    token: response.body.token,
    user: response.body.user
  };
}

function expectSafeRewardPayload(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
  expect(serialized).not.toContain('@example.com');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockNextUserId = 1;
  jest.clearAllMocks();
});

describe('Reward API', () => {
  it.each([
    { method: 'get', path: '/api/rewards/me' },
    { method: 'post', path: '/api/rewards/quests/1/claim' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('returns current reward account, quest progress, badges, and point history', async () => {
    const { token, user } = await registerTestUser();

    const response = await request(app)
      .get('/api/rewards/me')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.rewards.account).toEqual(
      expect.objectContaining({
        userId: user.id,
        pointBalance: 120
      })
    );
    expect(response.body.rewards.metrics).toEqual({
      totalStudyMinutes: 60,
      completedTaskCount: 1
    });
    expect(response.body.rewards.quests).toEqual([
      expect.objectContaining({
        code: 'TOTAL_STUDY_60',
        progressValue: 60,
        rewardPoints: 50,
        status: 'ACHIEVED'
      })
    ]);
    expect(response.body.rewards.badges).toEqual([
      expect.objectContaining({
        badge: expect.objectContaining({
          code: 'TOTAL_STUDY_60',
          iconUrl: '/assets/badges/total-study-60.png'
        })
      })
    ]);
    expectSafeRewardPayload(response.body);
  });

  it('claims an achieved quest reward once', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/rewards/quests/1/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.reward.account.pointBalance).toBe(170);
    expect(response.body.reward.quest).toEqual(
      expect.objectContaining({
        code: 'TOTAL_STUDY_60',
        status: 'CLAIMED',
        rewardPoints: 50
      })
    );
    expect(response.body.reward.pointTransaction).toEqual(
      expect.objectContaining({
        type: 'EARN',
        amount: 50,
        sourceType: 'REWARD_QUEST',
        sourceId: 1
      })
    );
    expect(response.body.reward.badge.badge.code).toBe('TOTAL_STUDY_60');
    expectSafeRewardPayload(response.body);
  });

  it('rejects invalid quest ids', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/rewards/quests/abc/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects claiming a quest that has not been achieved', async () => {
    rewardRepository.findUserQuestByUserIdAndQuestId.mockResolvedValueOnce(
    mockBuildUserQuest({
        progressValue: 20,
        status: 'IN_PROGRESS',
        achievedAt: null
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/rewards/quests/1/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });
});
