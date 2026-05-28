const mockUsers = [
  {
    id: 1,
    email: 'dev.user@example.com',
    name: 'Regular User',
    passwordHash: 'hashed-user-password',
    role: 'USER',
    status: 'ACTIVE'
  },
  {
    id: 2,
    email: 'dev.admin@example.com',
    name: 'Admin User',
    passwordHash: 'hashed-admin-password',
    role: 'ADMIN',
    status: 'ACTIVE'
  }
];

const mockBadges = [];
const mockQuests = [];
let mockNextBadgeId = 1;
let mockNextQuestId = 1;

function mockBuildBadge(data = {}) {
  const now = new Date();

  return {
    id: mockNextBadgeId++,
    code: 'TOTAL_STUDY_60',
    name: '60 Minute Focus',
    description: 'Earned after 60 total study minutes',
    iconUrl: '/assets/badges/total-study-60.png',
    condition: 'TOTAL_STUDY_MINUTES >= 60',
    createdAt: now,
    updatedAt: now,
    ...data
  };
}

function mockBuildQuest(data = {}) {
  const now = new Date();
  const badge = data.badge || mockBadges.find((item) => item.id === data.badgeId) || null;

  return {
    id: mockNextQuestId++,
    code: 'TOTAL_STUDY_60',
    title: 'Study for 60 minutes',
    description: 'Record at least 60 minutes of focus study time.',
    type: 'TOTAL_STUDY_MINUTES',
    targetValue: 60,
    rewardPoints: 50,
    badgeId: badge ? badge.id : null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    badge,
    ...data
  };
}

jest.mock('../src/repositories/user.repository', () => ({
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null),
  findUserByEmail: jest.fn(async (email) => mockUsers.find((user) => user.email === email) || null)
}));

jest.mock('../src/repositories/admin.repository', () => ({
  findAllUsers: jest.fn(),
  findUserById: jest.fn(),
  updateUserStatusAndLog: jest.fn(),
  findReportedPosts: jest.fn(),
  findReportedComments: jest.fn(),
  findAdminActions: jest.fn(),
  findCommunityReports: jest.fn(),
  findCommunityReportById: jest.fn(),
  processCommunityReport: jest.fn(),
  findPostById: jest.fn(),
  deletePostAndLog: jest.fn(),
  dismissPostReport: jest.fn(),
  findCommentById: jest.fn(),
  deleteCommentAndLog: jest.fn(),
  dismissCommentReport: jest.fn(),
  findChallengeById: jest.fn(),
  closeChallengeAndLog: jest.fn(),
  findRewardBadges: jest.fn(async () => [...mockBadges]),
  createRewardBadge: jest.fn(async (data) => {
    const badge = mockBuildBadge(data);
    mockBadges.push(badge);
    return badge;
  }),
  updateRewardBadge: jest.fn(async (id, data) => {
    const badge = mockBadges.find((item) => item.id === Number(id));

    if (!badge) {
      return null;
    }

    Object.assign(badge, data, { updatedAt: new Date() });
    return badge;
  }),
  findRewardBadgeById: jest.fn(async (id) =>
    mockBadges.find((item) => item.id === Number(id)) || null
  ),
  findRewardBadgeByCode: jest.fn(async (code) =>
    mockBadges.find((item) => item.code === code) || null
  ),
  findRewardQuests: jest.fn(async () => [...mockQuests]),
  createRewardQuest: jest.fn(async (data) => {
    const badge = data.badgeId ? mockBadges.find((item) => item.id === Number(data.badgeId)) : null;
    const quest = mockBuildQuest({
      ...data,
      badge
    });
    mockQuests.push(quest);
    return quest;
  }),
  updateRewardQuest: jest.fn(async (id, data) => {
    const quest = mockQuests.find((item) => item.id === Number(id));

    if (!quest) {
      return null;
    }

    let badge = quest.badge;

    if (Object.prototype.hasOwnProperty.call(data, 'badgeId')) {
      badge = data.badgeId
        ? mockBadges.find((item) => item.id === Number(data.badgeId)) || null
        : null;
    }

    Object.assign(quest, data, { badge, updatedAt: new Date() });
    return quest;
  }),
  findRewardQuestById: jest.fn(async (id) =>
    mockQuests.find((item) => item.id === Number(id)) || null
  ),
  findRewardQuestByCode: jest.fn(async (code) =>
    mockQuests.find((item) => item.code === code) || null
  )
}));

const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/jwt');
const { createAuthHeader } = require('./helpers/auth.helper');

function sendAdminRequest({ method, path, token, body }) {
  const requestBuilder = request(app)[method](path);

  if (token) {
    requestBuilder.set(createAuthHeader(token));
  }

  if (body) {
    requestBuilder.send(body);
  }

  return requestBuilder;
}

describe('Admin Reward APIs', () => {
  let userToken;
  let adminToken;

  beforeAll(() => {
    userToken = signToken({ id: 1, role: 'USER' });
    adminToken = signToken({ id: 2, role: 'ADMIN' });
  });

  beforeEach(() => {
    mockBadges.length = 0;
    mockQuests.length = 0;
    mockNextBadgeId = 1;
    mockNextQuestId = 1;
    jest.clearAllMocks();
  });

  it.each([
    { method: 'get', path: '/api/admin/rewards/badges' },
    { method: 'post', path: '/api/admin/rewards/badges', body: { code: 'A', name: 'B' } },
    { method: 'get', path: '/api/admin/rewards/quests' },
    {
      method: 'post',
      path: '/api/admin/rewards/quests',
      body: {
        code: 'Q',
        title: 'Quest',
        type: 'TOTAL_STUDY_MINUTES',
        targetValue: 60,
        rewardPoints: 50
      }
    }
  ])('rejects unauthenticated $method $path requests', async ({ method, path, body }) => {
    const response = await sendAdminRequest({ method, path, body });

    expect(response.status).toBe(401);
  });

  it('rejects regular users from reward admin endpoints', async () => {
    const response = await sendAdminRequest({
      method: 'get',
      path: '/api/admin/rewards/badges',
      token: userToken
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('creates and lists reward badges for administrators', async () => {
    const createResponse = await sendAdminRequest({
      method: 'post',
      path: '/api/admin/rewards/badges',
      token: adminToken,
      body: {
        code: 'TOTAL_STUDY_60',
        name: '60 Minute Focus',
        description: 'Earned after 60 total study minutes',
        iconUrl: '/assets/badges/total-study-60.png',
        condition: 'TOTAL_STUDY_MINUTES >= 60'
      }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.badge).toEqual(
      expect.objectContaining({
        code: 'TOTAL_STUDY_60',
        name: '60 Minute Focus'
      })
    );

    const listResponse = await sendAdminRequest({
      method: 'get',
      path: '/api/admin/rewards/badges',
      token: adminToken
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.badges).toHaveLength(1);
    expect(listResponse.body.badges[0].iconUrl).toBe('/assets/badges/total-study-60.png');
  });

  it('updates reward badges for administrators', async () => {
    const badge = mockBuildBadge();
    mockBadges.push(badge);

    const response = await sendAdminRequest({
      method: 'patch',
      path: `/api/admin/rewards/badges/${badge.id}`,
      token: adminToken,
      body: {
        name: 'Updated badge name',
        iconUrl: '/assets/badges/updated-badge.png'
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.badge).toEqual(
      expect.objectContaining({
        id: badge.id,
        name: 'Updated badge name',
        iconUrl: '/assets/badges/updated-badge.png'
      })
    );
  });

  it('rejects duplicate reward badge codes', async () => {
    mockBadges.push(mockBuildBadge());

    const response = await sendAdminRequest({
      method: 'post',
      path: '/api/admin/rewards/badges',
      token: adminToken,
      body: {
        code: 'TOTAL_STUDY_60',
        name: 'Duplicate badge'
      }
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
  });

  it('creates and lists reward quests for administrators', async () => {
    const badge = mockBuildBadge();
    mockBadges.push(badge);

    const createResponse = await sendAdminRequest({
      method: 'post',
      path: '/api/admin/rewards/quests',
      token: adminToken,
      body: {
        code: 'TOTAL_STUDY_60',
        title: 'Study for 60 minutes',
        description: 'Record at least 60 minutes of focus study time.',
        type: 'TOTAL_STUDY_MINUTES',
        targetValue: 60,
        rewardPoints: 50,
        badgeId: badge.id,
        isActive: true
      }
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.quest).toEqual(
      expect.objectContaining({
        code: 'TOTAL_STUDY_60',
        rewardPoints: 50,
        badgeId: badge.id
      })
    );

    const listResponse = await sendAdminRequest({
      method: 'get',
      path: '/api/admin/rewards/quests',
      token: adminToken
    });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.quests).toHaveLength(1);
    expect(listResponse.body.quests[0].badge.code).toBe('TOTAL_STUDY_60');
  });

  it('updates reward quests for administrators', async () => {
    const badge = mockBuildBadge();
    mockBadges.push(badge);
    const quest = mockBuildQuest({ badgeId: badge.id, badge });
    mockQuests.push(quest);

    const response = await sendAdminRequest({
      method: 'patch',
      path: `/api/admin/rewards/quests/${quest.id}`,
      token: adminToken,
      body: {
        targetValue: 90,
        rewardPoints: 75,
        isActive: false
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.quest).toEqual(
      expect.objectContaining({
        id: quest.id,
        targetValue: 90,
        rewardPoints: 75,
        isActive: false
      })
    );
  });

  it('rejects reward quests with missing badges', async () => {
    const response = await sendAdminRequest({
      method: 'post',
      path: '/api/admin/rewards/quests',
      token: adminToken,
      body: {
        code: 'TOTAL_STUDY_60',
        title: 'Study for 60 minutes',
        type: 'TOTAL_STUDY_MINUTES',
        targetValue: 60,
        rewardPoints: 50,
        badgeId: 999
      }
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('rejects invalid reward quest payloads', async () => {
    const response = await sendAdminRequest({
      method: 'post',
      path: '/api/admin/rewards/quests',
      token: adminToken,
      body: {
        code: 'TOTAL_STUDY_60',
        title: 'Study for 60 minutes',
        type: 'UNKNOWN_TYPE',
        targetValue: 60,
        rewardPoints: 50
      }
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
