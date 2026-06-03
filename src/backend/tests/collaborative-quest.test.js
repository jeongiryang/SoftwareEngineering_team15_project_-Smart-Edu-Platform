const mockUsers = [];
let mockNextUserId = 1;
const mockBroadcastRealtimeEventToUsers = jest.fn();

function mockBuildQuest(overrides = {}) {
  const baseUser = {
    id: 1,
    name: 'Quest User',
    loginId: 'quest_user'
  };
  const createdAt = new Date('2026-05-30T01:00:00Z');

  return {
    id: 1,
    title: 'Morning focus relay',
    description: 'Team up to collect focus points.',
    goalValue: 100,
    currentValue: 40,
    status: 'ACTIVE',
    rewardPoints: 30,
    startsAt: createdAt,
    endsAt: null,
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
    createdBy: baseUser,
    participants: [
      {
        questId: 1,
        userId: 1,
        contributionValue: 40,
        hiddenAt: null,
        archivedAt: null,
        joinedAt: createdAt,
        user: baseUser
      }
    ],
    rewardClaims: [],
    contributions: [
      {
        id: 1,
        questId: 1,
        userId: 1,
        amount: 40,
        memo: 'first sprint',
        createdAt,
        user: baseUser
      }
    ],
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

jest.mock('../src/repositories/collaborativeQuest.repository', () => ({
  addCollaborativeQuestContribution: jest.fn(async () => ({
    type: 'UPDATED',
    completed: false,
    quest: mockBuildQuest({
      currentValue: 55,
      participants: [
        {
          questId: 1,
          userId: 1,
          contributionValue: 55,
          hiddenAt: null,
          archivedAt: null,
          joinedAt: new Date('2026-05-30T01:00:00Z'),
          user: {
            id: 1,
            name: 'Quest User',
            loginId: 'quest_user'
          }
        }
      ]
    })
  })),
  addCollaborativeQuestParticipant: jest.fn(async (questId, userId) => mockBuildQuest({
    id: questId,
    participants: [
      ...mockBuildQuest().participants,
      {
        questId,
        userId,
        contributionValue: 0,
        hiddenAt: null,
        archivedAt: null,
        joinedAt: new Date('2026-05-30T01:10:00Z'),
        user: {
          id: userId,
          name: 'Joined User',
          loginId: 'joined_user'
        }
      }
    ]
  })),
  claimCollaborativeQuestReward: jest.fn(async () => ({
    type: 'CLAIMED',
    claim: {
      id: 1,
      questId: 1,
      userId: 1,
      rewardPoints: 30,
      claimedAt: new Date('2026-05-30T02:00:00Z')
    },
    account: {
      id: 1,
      userId: 1,
      pointBalance: 130
    },
    pointTransaction: {
      id: 1,
      type: 'EARN',
      amount: 30,
      reason: 'Morning focus relay collaborative quest reward',
      sourceType: 'COLLABORATIVE_QUEST',
      sourceId: 1,
      createdAt: new Date('2026-05-30T02:00:00Z')
    },
    quest: mockBuildQuest({
      currentValue: 100,
      status: 'COMPLETED',
      completedAt: new Date('2026-05-30T02:00:00Z'),
      rewardClaims: [
        {
          questId: 1,
          userId: 1,
          rewardPoints: 30,
          claimedAt: new Date('2026-05-30T02:00:00Z')
        }
      ]
    })
  })),
  createCollaborativeQuest: jest.fn(async ({ title, description, goalValue, rewardPoints, createdById }) =>
    mockBuildQuest({
      title,
      description,
      goalValue,
      rewardPoints,
      createdBy: {
        id: createdById,
        name: 'Quest User',
        loginId: 'quest_user'
      },
      participants: [
        {
            questId: 1,
            userId: createdById,
            contributionValue: 0,
            hiddenAt: null,
            archivedAt: null,
            joinedAt: new Date('2026-05-30T01:00:00Z'),
          user: {
            id: createdById,
            name: 'Quest User',
            loginId: 'quest_user'
          }
        }
      ]
    })
  ),
  findCollaborativeQuestById: jest.fn(async (questId) =>
    questId === 1 ? mockBuildQuest() : null
  ),
  findCollaborativeQuests: jest.fn(async () => [mockBuildQuest()]),
  updateCollaborativeQuestParticipantVisibility: jest.fn(async ({ questId, userId, hiddenAt, archivedAt }) => ({
    id: 1,
    questId,
    userId,
    contributionValue: 40,
    hiddenAt,
    archivedAt,
    joinedAt: new Date('2026-05-30T01:00:00Z'),
    quest: mockBuildQuest({
      id: questId,
      participants: [
        {
          questId,
          userId,
          contributionValue: 40,
          hiddenAt,
          archivedAt,
          joinedAt: new Date('2026-05-30T01:00:00Z'),
          user: {
            id: userId,
            name: 'Quest User',
            loginId: 'quest_user'
          }
        }
      ]
    })
  }))
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEvent: jest.fn(),
  broadcastRealtimeEventToUsers: (...args) => mockBroadcastRealtimeEventToUsers(...args),
  getOnlineUserIds: jest.fn(() => [])
}));

const request = require('supertest');
const app = require('../src/app');
const collaborativeQuestRepository = require('../src/repositories/collaborativeQuest.repository');
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

describe('Collaborative Quest API', () => {
  it.each([
    { method: 'get', path: '/api/collaborative-quests' },
    { method: 'post', path: '/api/collaborative-quests' },
    { method: 'post', path: '/api/collaborative-quests/1/contributions' },
    { method: 'patch', path: '/api/collaborative-quests/1/visibility' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('lists collaborative quests without exposing sensitive fields', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/collaborative-quests')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.quests).toHaveLength(1);
    expect(response.body.quests[0]).toEqual(
      expect.objectContaining({
        title: 'Morning focus relay',
        progressPercent: 40,
        participantCount: 1,
        recommendedContributionAmount: 10,
        recommendedRewardPoints: 30,
        hasJoined: true
      })
    );
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('passes includeHidden query when listing archived or hidden collaborative quests', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/collaborative-quests?includeHidden=true')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(collaborativeQuestRepository.findCollaborativeQuests).toHaveBeenCalledWith(
      expect.objectContaining({
        includeHidden: true,
        userId: 1
      })
    );
  });

  it('creates a collaborative quest and broadcasts progress to participants', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests')
      .set(createAuthHeader(token))
      .send({
        title: 'Evening review relay',
        description: 'Complete short reviews together.',
        goalValue: 80,
        rewardPoints: 25
      });

    expect(response.status).toBe(201);
    expect(response.body.quest).toEqual(
      expect.objectContaining({
        title: 'Evening review relay',
        goalValue: 80,
        rewardPoints: 25,
        hasJoined: true
      })
    );
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'collabQuest.progress.updated',
      {
        quest: expect.objectContaining({
          questId: 1,
          progressPercent: expect.any(Number),
          participantCount: 1,
          completed: false
        })
      }
    );
  });

  it('auto-calculates collaborative quest reward points when omitted', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests')
      .set(createAuthHeader(token))
      .send({
        title: 'Auto reward relay',
        description: 'Use the suggested reward policy.',
        goalValue: 80
      });

    expect(response.status).toBe(201);
    expect(response.body.quest).toEqual(
      expect.objectContaining({
        title: 'Auto reward relay',
        goalValue: 80,
        rewardPoints: 24
      })
    );
  });

  it('joins an active collaborative quest once', async () => {
    const { token } = await registerTestUser();
    collaborativeQuestRepository.findCollaborativeQuestById.mockResolvedValueOnce(
      mockBuildQuest({
        participants: []
      })
    );

    const response = await request(app)
      .post('/api/collaborative-quests/1/join')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.quest.participantCount).toBe(2);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'collabQuest.progress.updated',
      expect.objectContaining({
        quest: expect.objectContaining({
          questId: 1,
          participantCount: 2
        })
      })
    );
  });

  it('rejects duplicate collaborative quest joins', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/join')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
  });

  it('rejects expired collaborative quest joins', async () => {
    const { token } = await registerTestUser();
    collaborativeQuestRepository.findCollaborativeQuestById.mockResolvedValueOnce(
      mockBuildQuest({
        participants: [],
        endsAt: new Date(Date.now() - 60000)
      })
    );

    const response = await request(app)
      .post('/api/collaborative-quests/1/join')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
  });

  it('adds contribution and broadcasts a progress update', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/contributions')
      .set(createAuthHeader(token))
      .send({
        amount: 15,
        memo: 'reading sprint'
      });

    expect(response.status).toBe(201);
    expect(response.body.quest.currentValue).toBe(55);
    expect(response.body.completed).toBe(false);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'collabQuest.progress.updated',
      expect.objectContaining({
        quest: expect.objectContaining({
          questId: 1,
          currentValue: 55,
          completed: false
        })
      })
    );
  });

  it('broadcasts completion when a contribution completes the quest', async () => {
    collaborativeQuestRepository.addCollaborativeQuestContribution.mockResolvedValueOnce({
      type: 'UPDATED',
      completed: true,
      quest: mockBuildQuest({
        currentValue: 100,
        status: 'COMPLETED',
        completedAt: new Date('2026-05-30T02:00:00Z')
      })
    });
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/contributions')
      .set(createAuthHeader(token))
      .send({
        amount: 60
      });

    expect(response.status).toBe(201);
    expect(response.body.completed).toBe(true);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'collabQuest.completed',
      expect.objectContaining({
        quest: expect.objectContaining({
          questId: 1,
          status: 'COMPLETED',
          completed: true
        })
      })
    );
  });

  it('blocks non-participant contributions', async () => {
    collaborativeQuestRepository.addCollaborativeQuestContribution.mockResolvedValueOnce({
      type: 'NOT_PARTICIPANT'
    });
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/contributions')
      .set(createAuthHeader(token))
      .send({
        amount: 10
      });

    expect(response.status).toBe(409);
  });

  it('claims completed quest reward once', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.reward.reward.rewardPoints).toBe(30);
    expect(response.body.reward.pointTransaction.sourceType).toBe('COLLABORATIVE_QUEST');
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1]),
      'collabQuest.completed',
      expect.objectContaining({
        quest: expect.objectContaining({
          questId: 1,
          completed: true
        })
      })
    );
  });

  it('blocks duplicate reward claims', async () => {
    collaborativeQuestRepository.claimCollaborativeQuestReward.mockResolvedValueOnce({
      type: 'ALREADY_CLAIMED'
    });
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/collaborative-quests/1/claim')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(409);
  });

  it('hides an active collaborative quest only for the current participant', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/collaborative-quests/1/visibility')
      .set(createAuthHeader(token))
      .send({
        action: 'HIDE'
      });

    expect(response.status).toBe(200);
    expect(response.body.quest).toEqual(
      expect.objectContaining({
        currentUserHidden: true,
        currentUserArchived: false,
        hasJoined: true,
        canContribute: false,
        canClaim: false,
        participantCount: 0,
        participants: []
      })
    );
    expect(collaborativeQuestRepository.updateCollaborativeQuestParticipantVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: 1,
        userId: 1,
        hiddenAt: expect.any(Date),
        archivedAt: null
      })
    );
  });

  it('archives a completed collaborative quest without deleting progress or claims', async () => {
    collaborativeQuestRepository.findCollaborativeQuestById.mockResolvedValueOnce(
      mockBuildQuest({
        currentValue: 100,
        status: 'COMPLETED',
        completedAt: new Date('2026-05-30T02:00:00Z')
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/collaborative-quests/1/visibility')
      .set(createAuthHeader(token))
      .send({
        action: 'ARCHIVE'
      });

    expect(response.status).toBe(200);
    expect(response.body.quest.currentUserArchived).toBe(true);
    expect(response.body.quest.currentValue).toBe(40);
    expect(collaborativeQuestRepository.updateCollaborativeQuestParticipantVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: 1,
        userId: 1,
        hiddenAt: null,
        archivedAt: expect.any(Date)
      })
    );
  });

  it('restores a hidden or archived collaborative quest to the current user list', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/collaborative-quests/1/visibility')
      .set(createAuthHeader(token))
      .send({
        action: 'RESTORE'
      });

    expect(response.status).toBe(200);
    expect(response.body.quest.currentUserHidden).toBe(false);
    expect(response.body.quest.currentUserArchived).toBe(false);
    expect(collaborativeQuestRepository.updateCollaborativeQuestParticipantVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        hiddenAt: null,
        archivedAt: null
      })
    );
  });

  it('blocks archiving an active collaborative quest', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/collaborative-quests/1/visibility')
      .set(createAuthHeader(token))
      .send({
        action: 'ARCHIVE'
      });

    expect(response.status).toBe(409);
  });

  it('blocks visibility changes for non-participants', async () => {
    collaborativeQuestRepository.findCollaborativeQuestById.mockResolvedValueOnce(
      mockBuildQuest({
        participants: []
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/collaborative-quests/1/visibility')
      .set(createAuthHeader(token))
      .send({
        action: 'HIDE'
      });

    expect(response.status).toBe(409);
  });
});
