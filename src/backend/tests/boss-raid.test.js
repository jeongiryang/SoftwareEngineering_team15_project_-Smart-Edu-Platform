const mockUsers = [];
let mockNextUserId = 1;

const mockBossBadge = {
  id: 99,
  code: 'BOSS_DAWN_SLAYER',
  name: '새벽 보스 슬레이어',
  description: '스터디 보스를 처치한 파티에게 지급되는 한정 배지',
  iconUrl: '/assets/badges/boss-dawn-slayer.png',
  condition: 'BOSS_RAID_CLEAR'
};

function mockBuildRaid() {
  return {
    id: 1,
    code: 'DAWN_PENCIL_BOSS',
    name: '새벽 연필 보스',
    description: '집중 시간과 태스크 완료로 HP를 깎는 협동 레이드 보스',
    imageUrl: '/assets/raids/dawn-pencil-boss.png',
    maxHp: 300,
    focusMinuteDamage: 1,
    taskCompletionDamage: 15,
    baseRewardPoints: 50,
    bonusRewardPoolPoints: 100,
    startsAt: new Date('2026-05-29T00:00:00Z'),
    endsAt: new Date('2026-06-05T00:00:00Z'),
    isActive: true,
    badge: mockBossBadge
  };
}

function mockBuildParty(overrides = {}) {
  const raid = overrides.raid || mockBuildRaid();

  return {
    id: 10,
    raidId: raid.id,
    ownerId: 1,
    name: '아침 집중팟',
    joinCode: 'ABC123',
    status: 'OPEN',
    totalDamage: 140,
    remainingHp: 160,
    clearedAt: null,
    lastCalculatedAt: new Date('2026-05-29T01:00:00Z'),
    raid,
    owner: {
      id: 1,
      name: 'Test User',
      email: 'test.user@example.com'
    },
    members: [
      {
        userId: 1,
        joinedAt: new Date('2026-05-29T00:30:00Z'),
        user: {
          id: 1,
          name: 'Test User',
          email: 'test.user@example.com'
        }
      },
      {
        userId: 2,
        joinedAt: new Date('2026-05-29T00:35:00Z'),
        user: {
          id: 2,
          name: 'Party Mate',
          email: 'party.mate@example.com'
        }
      }
    ],
    contributions: [
      {
        userId: 1,
        focusMinutes: 80,
        completedTaskCount: 2,
        totalDamage: 110,
        lastContributedAt: new Date('2026-05-29T01:00:00Z'),
        user: {
          id: 1,
          name: 'Test User',
          email: 'test.user@example.com'
        }
      },
      {
        userId: 2,
        focusMinutes: 15,
        completedTaskCount: 1,
        totalDamage: 30,
        lastContributedAt: new Date('2026-05-29T01:00:00Z'),
        user: {
          id: 2,
          name: 'Party Mate',
          email: 'party.mate@example.com'
        }
      }
    ],
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

jest.mock('../src/repositories/bossRaid.repository', () => ({
  addBossRaidPartyMember: jest.fn(async (partyId, userId) =>
    mockBuildParty({
      id: partyId,
      members: [
        ...mockBuildParty().members,
        {
          userId,
          joinedAt: new Date('2026-05-29T00:40:00Z'),
          user: {
            id: userId,
            name: 'Joined User',
            email: 'joined.user@example.com'
          }
        }
      ],
      contributions: [
        ...mockBuildParty().contributions,
        {
          userId,
          focusMinutes: 0,
          completedTaskCount: 0,
          totalDamage: 0,
          lastContributedAt: new Date('2026-05-29T00:40:00Z'),
          user: {
            id: userId,
            name: 'Joined User',
            email: 'joined.user@example.com'
          }
        }
      ]
    })
  ),
  claimBossRaidReward: jest.fn(async ({ userId, party, baseRewardPoints, bonusRewardPoints }) => ({
    claim: {
      id: 1,
      raidId: party.raidId,
      partyId: party.id,
      userId,
      baseRewardPoints,
      bonusRewardPoints
    },
    account: {
      id: 1,
      userId,
      pointBalance: baseRewardPoints + bonusRewardPoints
    },
    pointTransaction: {
      id: 1,
      userId,
      accountId: 1,
      type: 'EARN',
      amount: baseRewardPoints + bonusRewardPoints,
      reason: `${party.raid.name} 처치 보상`,
      sourceType: 'BOSS_RAID',
      sourceId: party.id,
      createdAt: new Date('2026-05-29T02:00:00Z')
    },
    userBadge: {
      id: 1,
      userId,
      badgeId: mockBossBadge.id,
      badge: mockBossBadge
    }
  })),
  createBossRaidParty: jest.fn(async ({ raidId, ownerId, name, joinCode }) =>
    mockBuildParty({
      raidId,
      ownerId,
      name,
      joinCode
    })
  ),
  findActiveBossRaids: jest.fn(async () => [mockBuildRaid()]),
  findBossRaidById: jest.fn(async (raidId) =>
    raidId === 1 ? mockBuildRaid() : null
  ),
  findBossRaidPartyById: jest.fn(async (partyId) =>
    partyId === 10 ? mockBuildParty() : null
  ),
  findBossRaidPartyByJoinCode: jest.fn(async (joinCode) =>
    joinCode === 'ABC123' ? mockBuildParty() : null
  ),
  findBossRaidRewardClaim: jest.fn(async () => null),
  findUserBossRaidParties: jest.fn(async () => [mockBuildParty()]),
  findUserBossRaidPartyForRaid: jest.fn(async () => null),
  getBossRaidMemberMetrics: jest.fn(async () => ({
    focusMinutes: 20,
    completedTaskCount: 1
  })),
  replaceBossRaidContributions: jest.fn(async (partyId) => mockBuildParty({ id: partyId })),
  updateBossRaidPartyProgress: jest.fn(async (partyId, data) =>
    mockBuildParty({
      id: partyId,
      ...data,
      raid: mockBuildRaid(),
      contributions: mockBuildParty().contributions
    })
  )
}));

const request = require('supertest');
const app = require('../src/app');
const bossRaidRepository = require('../src/repositories/bossRaid.repository');
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

beforeEach(() => {
  mockUsers.length = 0;
  mockNextUserId = 1;
  jest.clearAllMocks();
});

describe('Boss Raid API', () => {
  it.each([
    { method: 'get', path: '/api/boss-raids' },
    { method: 'get', path: '/api/boss-raids/parties/me' },
    { method: 'post', path: '/api/boss-raids/parties' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('returns active boss raids for the current user', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.raids).toEqual([
      expect.objectContaining({
        code: 'DAWN_PENCIL_BOSS',
        name: '새벽 연필 보스'
      })
    ]);
  });

  it('creates a new boss raid party with a join code', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties')
      .set(createAuthHeader(token))
      .send({
        raidId: 1,
        name: '아침 집중팟'
      });

    expect(response.status).toBe(201);
    expect(response.body.party).toEqual(
      expect.objectContaining({
        name: '아침 집중팟'
      })
    );
    expect(response.body.party.joinCode).toHaveLength(6);
  });

  it('joins a boss raid party by join code', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties/join')
      .set(createAuthHeader(token))
      .send({
        joinCode: 'ABC123'
      });

    expect(response.status).toBe(200);
    expect(response.body.party.joinCode).toBe('ABC123');
  });

  it('returns a joined party detail with contribution data', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids/parties/10')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.party).toEqual(
      expect.objectContaining({
        id: 10,
        totalMembers: 2,
        raid: expect.objectContaining({
          code: 'DAWN_PENCIL_BOSS'
        })
      })
    );
  });

  it('claims a cleared boss raid reward once', async () => {
    bossRaidRepository.findBossRaidPartyById.mockResolvedValueOnce(
      mockBuildParty({
        status: 'CLEARED',
        totalDamage: 340,
        clearedAt: new Date('2026-05-29T02:00:00Z')
      })
    );
    bossRaidRepository.updateBossRaidPartyProgress.mockResolvedValueOnce(
      mockBuildParty({
        status: 'CLEARED',
        totalDamage: 340,
        clearedAt: new Date('2026-05-29T02:00:00Z')
      })
    );

    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties/10/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.reward.reward).toEqual(
      expect.objectContaining({
        baseRewardPoints: 50,
        totalRewardPoints: 128
      })
    );
    expect(response.body.reward.badge.code).toBe('BOSS_DAWN_SLAYER');
  });
});
