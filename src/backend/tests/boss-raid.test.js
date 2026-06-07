const mockUsers = [];
let mockNextUserId = 1;
const mockBroadcastRealtimeEventToUsers = jest.fn();

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
    endsAt: new Date('2099-06-05T00:00:00Z'),
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
    isPublic: true,
    status: 'OPEN',
    totalDamage: 140,
    remainingHp: 160,
    clearedAt: null,
    lastCalculatedAt: new Date('2026-05-29T01:00:00Z'),
    raid,
    owner: {
      id: 1,
      name: 'Test User',
      loginId: 'test_user'
    },
    members: [
      {
        userId: 1,
        joinedAt: new Date('2026-05-29T00:30:00Z'),
        hiddenAt: null,
        archivedAt: null,
        leftAt: null,
        user: {
          id: 1,
          name: 'Test User',
          loginId: 'test_user'
        }
      },
      {
        userId: 2,
        joinedAt: new Date('2026-05-29T00:35:00Z'),
        hiddenAt: null,
        archivedAt: null,
        leftAt: null,
        user: {
          id: 2,
          name: 'Party Mate',
          loginId: 'party_mate'
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
          loginId: 'test_user'
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
          loginId: 'party_mate'
        }
      }
    ],
    ...overrides
  };
}

function mockBuildInvite(overrides = {}) {
  return {
    id: 20,
    partyId: 10,
    inviterId: 1,
    inviteeId: 2,
    status: 'PENDING',
    createdAt: new Date('2026-05-29T00:45:00Z'),
    updatedAt: new Date('2026-05-29T00:45:00Z'),
    respondedAt: null,
    party: mockBuildParty({ isPublic: false }),
    inviter: {
      id: 1,
      name: 'Test User',
      loginId: 'test_user'
    },
    invitee: {
      id: 2,
      name: 'Invitee User',
      loginId: 'invitee_user'
    },
    ...overrides
  };
}

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

    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/bossRaid.repository', () => ({
  acceptBossRaidInvite: jest.fn(async ({ partyId, userId }) =>
    mockBuildParty({
      id: partyId,
      isPublic: false,
      members: [
        ...mockBuildParty().members,
        {
          userId,
          joinedAt: new Date('2026-05-29T00:50:00Z'),
          hiddenAt: null,
          archivedAt: null,
          leftAt: null,
          user: {
            id: userId,
            name: 'Invitee User',
            loginId: 'invitee_user'
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
          lastContributedAt: new Date('2026-05-29T00:50:00Z'),
          user: {
            id: userId,
            name: 'Invitee User',
            loginId: 'invitee_user'
          }
        }
      ]
    })
  ),
  addBossRaidPartyMember: jest.fn(async (partyId, userId) =>
    mockBuildParty({
      id: partyId,
      members: [
        ...mockBuildParty().members,
        {
          userId,
          joinedAt: new Date('2026-05-29T00:40:00Z'),
          hiddenAt: null,
          archivedAt: null,
          leftAt: null,
          user: {
            id: userId,
            name: 'Joined User',
            loginId: 'joined_user'
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
            loginId: 'joined_user'
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
  createBossRaidParty: jest.fn(async ({ raidId, ownerId, name, joinCode, isPublic = true }) =>
    mockBuildParty({
      raidId,
      ownerId,
      name,
      joinCode,
      isPublic
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
  findBossRaidInviteById: jest.fn(async (inviteId) =>
    Number(inviteId) === 20 ? mockBuildInvite() : null
  ),
  findBossRaidInviteForPartyAndUser: jest.fn(async () => null),
  findBossRaidInvitesForParty: jest.fn(async () => [mockBuildInvite()]),
  findBossRaidInvitesForUser: jest.fn(async () => [mockBuildInvite()]),
  findPublicBossRaidParties: jest.fn(async () => [mockBuildParty()]),
  findBossRaidRewardClaim: jest.fn(async () => null),
  findUserBossRaidParties: jest.fn(async () => [mockBuildParty()]),
  findUserBossRaidPartyForRaid: jest.fn(async () => null),
  getBossRaidMemberMetrics: jest.fn(async () => ({
    focusMinutes: 20,
    completedTaskCount: 1
  })),
  replaceBossRaidContributions: jest.fn(async (partyId) => mockBuildParty({ id: partyId })),
  updateBossRaidPartyMemberVisibility: jest.fn(async ({ partyId, userId, hiddenAt, archivedAt, leftAt }) => {
    const party = mockBuildParty({
      id: partyId,
      members: mockBuildParty().members.map((member) => (
        member.userId === userId
          ? {
              ...member,
              hiddenAt,
              archivedAt,
              leftAt
            }
          : member
      ))
    });
    const member = party.members.find((partyMember) => partyMember.userId === userId);

    return {
      ...member,
      party
    };
  }),
  updateBossRaidInviteStatus: jest.fn(async (inviteId, status) =>
    mockBuildInvite({
      id: inviteId,
      status,
      respondedAt: new Date('2026-05-29T00:55:00Z')
    })
  ),
  upsertBossRaidInvite: jest.fn(async ({ partyId, inviterId, inviteeId }) =>
    mockBuildInvite({
      partyId,
      inviterId,
      inviteeId
    })
  ),
  updateBossRaidPartyProgress: jest.fn(async (partyId, data) =>
    mockBuildParty({
      id: partyId,
      ...data,
      raid: mockBuildRaid(),
      contributions: mockBuildParty().contributions
    })
  )
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEvent: jest.fn(),
  broadcastRealtimeEventToUsers: (...args) => mockBroadcastRealtimeEventToUsers(...args),
  getOnlineUserIds: jest.fn(() => [])
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
  mockBroadcastRealtimeEventToUsers.mockClear();
  jest.clearAllMocks();
});

describe('Boss Raid API', () => {
  it.each([
    { method: 'get', path: '/api/boss-raids' },
    { method: 'get', path: '/api/boss-raids/invites/me' },
    { method: 'get', path: '/api/boss-raids/parties/me' },
    { method: 'get', path: '/api/boss-raids/parties/public' },
    { method: 'post', path: '/api/boss-raids/parties' },
    { method: 'post', path: '/api/boss-raids/parties/10/invites' },
    { method: 'post', path: '/api/boss-raids/parties/10/leave' },
    { method: 'post', path: '/api/boss-raids/parties/10/archive' },
    { method: 'post', path: '/api/boss-raids/parties/10/restore' },
    { method: 'post', path: '/api/boss-raids/invites/20/accept' },
    { method: 'post', path: '/api/boss-raids/invites/20/decline' },
    { method: 'post', path: '/api/boss-raids/invites/20/cancel' }
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
    expect(response.body.party.isPublic).toBe(true);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.progress.updated',
      {
        party: expect.objectContaining({
          id: 10,
          partyId: 10,
          raidId: 1,
          raid: expect.objectContaining({ id: 1 }),
          progressRate: expect.any(Number),
          participantCount: 2,
          completed: false
        })
      }
    );
  });

  it('lists public boss raid parties without joining by invite code', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids/parties/public')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.parties).toHaveLength(1);
    expect(response.body.parties[0]).toEqual(
      expect.objectContaining({
        id: 10,
        isPublic: true,
        inviteMode: 'PUBLIC'
      })
    );
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
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.progress.updated',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          participantCount: 2,
          completed: false
        })
      })
    );
  });

  it('joins a public boss raid party by party id', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties/10/join')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.party.id).toBe(10);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.progress.updated',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          participantCount: 2
        })
      })
    );
  });

  it('does not expose private boss raid parties through public join', async () => {
    bossRaidRepository.findBossRaidPartyById.mockResolvedValueOnce(
      mockBuildParty({
        isPublic: false
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties/10/join')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(404);
  });

  it('lists pending boss raid invites for the current user', async () => {
    await registerTestUser();
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids/invites/me')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.invites).toHaveLength(1);
    expect(response.body.invites[0]).toEqual(
      expect.objectContaining({
        id: 20,
        status: 'PENDING',
        invitee: expect.objectContaining({
          loginId: 'invitee_user'
        }),
        party: expect.objectContaining({
          id: 10,
          inviteMode: 'PRIVATE'
        })
      })
    );
  });

  it('lets a party owner send a boss raid invite by loginId', async () => {
    const { token } = await registerTestUser({ loginId: 'test_user' });
    const invitee = await registerTestUser({ loginId: 'invitee_user' });
    bossRaidRepository.findBossRaidPartyById.mockResolvedValueOnce(
      mockBuildParty({
        isPublic: false,
        members: [mockBuildParty().members[0]],
        contributions: [mockBuildParty().contributions[0]]
      })
    );

    const response = await request(app)
      .post('/api/boss-raids/parties/10/invites')
      .set(createAuthHeader(token))
      .send({
        loginId: invitee.payload.loginId
      });

    expect(response.status).toBe(201);
    expect(response.body.invite).toEqual(
      expect.objectContaining({
        partyId: 10,
        status: 'PENDING',
        invitee: expect.objectContaining({
          id: invitee.user.id
        })
      })
    );
    expect(bossRaidRepository.upsertBossRaidInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 10,
        inviterId: 1,
        inviteeId: invitee.user.id
      })
    );
  });

  it('prevents non-owners from managing boss raid invites', async () => {
    await registerTestUser();
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/boss-raids/parties/10/invites')
      .set(createAuthHeader(token))
      .send({
        loginId: 'test_user'
      });

    expect(response.status).toBe(409);
  });

  it('accepts a pending boss raid invite and joins the private party', async () => {
    await registerTestUser();
    const { token } = await registerTestUser({ loginId: 'invitee_user' });

    const response = await request(app)
      .post('/api/boss-raids/invites/20/accept')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.party).toEqual(
      expect.objectContaining({
        id: 10
      })
    );
    expect(bossRaidRepository.acceptBossRaidInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteId: 20,
        partyId: 10,
        userId: 2
      })
    );
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.progress.updated',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          participantCount: expect.any(Number)
        })
      })
    );
  });

  it('declines a pending boss raid invite', async () => {
    await registerTestUser();
    const { token } = await registerTestUser({ loginId: 'invitee_user' });

    const response = await request(app)
      .post('/api/boss-raids/invites/20/decline')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.invite.status).toBe('DECLINED');
    expect(bossRaidRepository.updateBossRaidInviteStatus).toHaveBeenCalledWith(20, 'DECLINED');
  });

  it('cancels a pending boss raid invite by the party owner', async () => {
    const { token } = await registerTestUser({ loginId: 'test_user' });

    const response = await request(app)
      .post('/api/boss-raids/invites/20/cancel')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.invite.status).toBe('CANCELLED');
    expect(bossRaidRepository.updateBossRaidInviteStatus).toHaveBeenCalledWith(20, 'CANCELLED');
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
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.progress.updated',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          raid: expect.objectContaining({ id: 1 }),
          completed: false
        })
      })
    );
  });

  it('passes includeHidden when listing archived boss raid parties', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids/parties/me?includeHidden=true')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(bossRaidRepository.findUserBossRaidParties).toHaveBeenCalledWith(1, {
      includeHidden: true
    });
  });

  it('excludes left members from the active boss raid detail count', async () => {
    bossRaidRepository.findBossRaidPartyById.mockResolvedValueOnce(
      mockBuildParty({
        lastCalculatedAt: new Date(),
        members: mockBuildParty().members.map((member) => (
          member.userId === 2
            ? { ...member, hiddenAt: new Date('2026-05-29T01:10:00Z'), leftAt: new Date('2026-05-29T01:10:00Z') }
            : member
        ))
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/boss-raids/parties/10')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.party.totalMembers).toBe(1);
    expect(response.body.party.members).toEqual([
      expect.objectContaining({ userId: 1 })
    ]);
    expect(response.body.party.contributions).toEqual([
      expect.objectContaining({ userId: 1 })
    ]);
  });

  it('lets a non-owner leave an in-progress boss raid without deleting contribution records', async () => {
    await registerTestUser({ loginId: 'owner_user' });
    const { token } = await registerTestUser({ loginId: 'member_user' });

    const response = await request(app)
      .post('/api/boss-raids/parties/10/leave')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(bossRaidRepository.updateBossRaidPartyMemberVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 10,
        userId: 2,
        hiddenAt: expect.any(Date),
        archivedAt: null,
        leftAt: expect.any(Date)
      })
    );
    expect(bossRaidRepository.replaceBossRaidContributions).not.toHaveBeenCalled();
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'bossRaid.progress.updated',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          participantCount: 1
        })
      })
    );
  });

  it('prevents the owner from leaving while other active members remain', async () => {
    const { token } = await registerTestUser({ loginId: 'owner_user' });

    const response = await request(app)
      .post('/api/boss-raids/parties/10/leave')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
    expect(bossRaidRepository.updateBossRaidPartyMemberVisibility).not.toHaveBeenCalled();
  });

  it('archives and restores a completed boss raid for the current participant', async () => {
    bossRaidRepository.findBossRaidPartyById
      .mockResolvedValueOnce(
        mockBuildParty({
          status: 'CLEARED',
          totalDamage: 340,
          remainingHp: 0,
          clearedAt: new Date('2026-05-29T02:00:00Z')
        })
      )
      .mockResolvedValueOnce(
        mockBuildParty({
          status: 'CLEARED',
          totalDamage: 340,
          remainingHp: 0,
          clearedAt: new Date('2026-05-29T02:00:00Z'),
          members: mockBuildParty().members.map((member) => (
            member.userId === 1
              ? {
                  ...member,
                  hiddenAt: new Date('2026-05-29T02:10:00Z'),
                  archivedAt: new Date('2026-05-29T02:10:00Z')
                }
              : member
          ))
        })
      );
    const { token } = await registerTestUser();

    const archiveResponse = await request(app)
      .post('/api/boss-raids/parties/10/archive')
      .set(createAuthHeader(token))
      .send({});

    expect(archiveResponse.status).toBe(200);
    expect(bossRaidRepository.updateBossRaidPartyMemberVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        partyId: 10,
        userId: 1,
        hiddenAt: expect.any(Date),
        archivedAt: expect.any(Date),
        leftAt: null
      })
    );

    const restoreResponse = await request(app)
      .post('/api/boss-raids/parties/10/restore')
      .set(createAuthHeader(token))
      .send({});

    expect(restoreResponse.status).toBe(200);
    expect(bossRaidRepository.updateBossRaidPartyMemberVisibility).toHaveBeenLastCalledWith(
      expect.objectContaining({
        partyId: 10,
        userId: 1,
        hiddenAt: null,
        archivedAt: null,
        leftAt: null
      })
    );
  });

  it('rejects archive requests from non-participants', async () => {
    await registerTestUser({ loginId: 'owner_user' });
    await registerTestUser({ loginId: 'member_user' });
    const { token } = await registerTestUser({ loginId: 'outsider_user' });

    const response = await request(app)
      .post('/api/boss-raids/parties/10/archive')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
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
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'bossRaid.completed',
      expect.objectContaining({
        party: expect.objectContaining({
          id: 10,
          status: 'CLEARED',
          completed: true
        })
      })
    );
  });
});
