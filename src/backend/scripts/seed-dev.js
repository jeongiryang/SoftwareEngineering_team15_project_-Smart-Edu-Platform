const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { hashPassword } = require('../src/utils/password');

// 개인 로컬/개발 DB 전용 seed script임. 운영/공유 DB에서는 실행하지 않는다.
// 실행 명령은 기존 package script(`npm run seed:dev`)를 사용한다.
const DEV_SEED_PASSWORD = 'dev-password-1234';
const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'DIRECT_URL'];
const PRODUCTION_URL_PATTERNS = ['production', 'prod-', 'prod.'];

const DEV_SEED_USERS = [
  {
    loginId: 'dev_user',
    name: '개발용 일반 사용자',
    role: 'USER',
    userType: 'HIGH',
    status: 'ACTIVE',
    profile: {
      learningGoal: '기말고사 전까지 소프트웨어공학 핵심 개념 정리',
      preferredSubject: '소프트웨어공학',
      profileImageUrl: null
    }
  },
  {
    loginId: 'study_peer',
    name: '개발용 스터디 친구',
    role: 'USER',
    userType: 'UNIVERSITY',
    status: 'ACTIVE',
    profile: {
      learningGoal: '스터디 인증과 커뮤니티 피드백 참여',
      preferredSubject: '웹 개발',
      profileImageUrl: null
    }
  },
  {
    loginId: 'friend_user',
    name: '개발용 친구 상태 사용자',
    role: 'USER',
    userType: 'UNIVERSITY',
    status: 'ACTIVE',
    profile: {
      learningGoal: '친구 목록, 요청 상태, 접속 상태 표시 흐름 점검',
      preferredSubject: '협업 학습',
      profileImageUrl: null
    }
  },
  {
    loginId: 'community_user',
    name: '개발용 커뮤니티 활동 사용자',
    role: 'USER',
    userType: 'MIDDLE',
    status: 'ACTIVE',
    profile: {
      learningGoal: '질문, 자료 공유, 공부 인증으로 스터디 분위기 만들기',
      preferredSubject: '영어',
      profileImageUrl: null
    }
  },
  {
    loginId: 'reward_user',
    name: '개발용 보상 데모 사용자',
    role: 'USER',
    userType: 'EXAM_PREP',
    status: 'ACTIVE',
    profile: {
      learningGoal: '퀘스트와 배지를 활용한 학습 루틴 유지',
      preferredSubject: '자료구조',
      profileImageUrl: null
    }
  },
  {
    loginId: 'accessibility_user',
    name: '개발용 접근성 설정 사용자',
    role: 'USER',
    userType: 'SENIOR',
    status: 'ACTIVE',
    profile: {
      learningGoal: '큰 글씨와 음성 안내를 활용해 복습 루틴 유지',
      preferredSubject: '생활 영어',
      profileImageUrl: null
    }
  },
  {
    loginId: 'raid_user',
    name: '개발용 보스 레이드 사용자',
    role: 'USER',
    userType: 'HIGH',
    status: 'ACTIVE',
    profile: {
      learningGoal: '스터디 보스 레이드 참여와 실시간 진행률 확인',
      preferredSubject: '집중 학습',
      profileImageUrl: null
    }
  },
  {
    loginId: 'quest_user',
    name: '개발용 협동 퀘스트 사용자',
    role: 'USER',
    userType: 'EXAM_PREP',
    status: 'ACTIVE',
    profile: {
      learningGoal: '협동 퀘스트 참여, 기여도, 보상 수령 흐름 확인',
      preferredSubject: '프로젝트 학습',
      profileImageUrl: null
    }
  },
  {
    loginId: 'team_user_01',
    name: '개발용 팀 학습 사용자 1',
    role: 'USER',
    userType: 'UNIVERSITY',
    status: 'ACTIVE',
    profile: {
      learningGoal: '팀 단위 협동 학습과 실시간 진행률 QA 참여',
      preferredSubject: '소프트웨어공학',
      profileImageUrl: null
    }
  },
  {
    loginId: 'team_user_02',
    name: '개발용 팀 학습 사용자 2',
    role: 'USER',
    userType: 'UNIVERSITY',
    status: 'ACTIVE',
    profile: {
      learningGoal: '협동 퀘스트 기여도와 친구 관계 시나리오 확인',
      preferredSubject: '자료구조',
      profileImageUrl: null
    }
  },
  {
    loginId: 'team_user_03',
    name: '개발용 팀 학습 사용자 3',
    role: 'USER',
    userType: 'WORKER',
    status: 'ACTIVE',
    profile: {
      learningGoal: '마감 전 팀 학습 루틴과 보상 claim 상태 확인',
      preferredSubject: '서비스 운영',
      profileImageUrl: null
    }
  },
  {
    loginId: 'beginner_user',
    name: '개발용 초보 루틴 사용자',
    role: 'USER',
    userType: 'ELEMENTARY',
    status: 'ACTIVE',
    profile: {
      learningGoal: '작은 목표를 매일 하나씩 완료하며 학습 루틴 만들기',
      preferredSubject: '수학',
      profileImageUrl: null
    }
  },
  {
    loginId: 'admin_user',
    name: '개발용 관리자',
    role: 'ADMIN',
    userType: 'WORKER',
    status: 'ACTIVE',
    profile: {
      learningGoal: '관리자 기능과 신고 처리 흐름 점검',
      preferredSubject: '서비스 운영',
      profileImageUrl: null
    }
  }
];

const DEV_SHOP_ITEMS = [
  {
    code: 'PROFILE_AVATAR_SKY',
    name: '하늘 연필 아바타',
    description: '밝은 하늘색 톤의 프로필 이미지를 적용합니다.',
    type: 'PROFILE_IMAGE',
    price: 15,
    assetUrl: '/assets/shop/avatar-sky.png'
  },
  {
    code: 'PROFILE_AVATAR_FOREST',
    name: '숲 연필 아바타',
    description: '차분한 초록 톤의 프로필 이미지를 적용합니다.',
    type: 'PROFILE_IMAGE',
    price: 20,
    assetUrl: '/assets/shop/avatar-forest.png'
  },
  {
    code: 'PROFILE_AVATAR_SUNSET',
    name: '노을 연필 아바타',
    description: '따뜻한 노을 톤의 프로필 이미지를 적용합니다.',
    type: 'PROFILE_IMAGE',
    price: 24,
    assetUrl: '/assets/shop/avatar-sunset.png'
  },
  {
    code: 'PROFILE_AVATAR_NIGHT',
    name: '야간 집중 아바타',
    description: '차분한 밤하늘 톤의 프로필 이미지를 적용합니다.',
    type: 'PROFILE_IMAGE',
    price: 28,
    assetUrl: '/assets/shop/avatar-night.png'
  },
  {
    code: 'PROFILE_BACKGROUND_DAWN',
    name: '새벽 학습 배경',
    description: '잔잔한 새벽 톤 배경을 프로필에 적용합니다.',
    type: 'PROFILE_BACKGROUND',
    price: 25,
    assetUrl: '/assets/shop/background-dawn.png'
  },
  {
    code: 'PROFILE_BACKGROUND_MINT',
    name: '민트 노트 배경',
    description: '민트 톤 노트 스타일 배경을 프로필에 적용합니다.',
    type: 'PROFILE_BACKGROUND',
    price: 30,
    assetUrl: '/assets/shop/background-mint.png'
  },
  {
    code: 'PROFILE_BACKGROUND_CORAL',
    name: '코랄 플래너 배경',
    description: '따뜻한 코랄 톤의 플래너 스타일 배경을 적용합니다.',
    type: 'PROFILE_BACKGROUND',
    price: 34,
    assetUrl: '/assets/shop/background-coral.png'
  },
  {
    code: 'PROFILE_BACKGROUND_NIGHT',
    name: '별밤 집중 배경',
    description: '밤하늘 별빛 느낌의 배경을 프로필에 적용합니다.',
    type: 'PROFILE_BACKGROUND',
    price: 38,
    assetUrl: '/assets/shop/background-night.png'
  },
  {
    code: 'TITLE_EARLY_BIRD',
    name: '아침형 학습러',
    description: '일찍 시작하는 학습자용 칭호입니다.',
    type: 'TITLE',
    price: 18,
    assetUrl: null
  },
  {
    code: 'TITLE_TASK_MASTER',
    name: '할 일 정복자',
    description: '할 일 관리에 강한 학습자용 칭호입니다.',
    type: 'TITLE',
    price: 22,
    assetUrl: null
  },
  {
    code: 'TITLE_DEEP_FOCUS',
    name: '몰입 장인',
    description: '긴 집중 세션을 즐기는 학습자를 위한 칭호입니다.',
    type: 'TITLE',
    price: 26,
    assetUrl: null
  },
  {
    code: 'TITLE_COMMUNITY_HELPER',
    name: '질문 해결사',
    description: '커뮤니티에서 활발히 돕는 학습자를 위한 칭호입니다.',
    type: 'TITLE',
    price: 26,
    assetUrl: null
  }
];

const DEV_SHOP_PURCHASES = [
  {
    loginId: 'dev_user',
    itemCodes: ['PROFILE_AVATAR_SKY', 'PROFILE_BACKGROUND_DAWN', 'TITLE_EARLY_BIRD'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_SKY',
      profileBackground: 'PROFILE_BACKGROUND_DAWN',
      title: 'TITLE_EARLY_BIRD'
    }
  },
  {
    loginId: 'reward_user',
    itemCodes: ['PROFILE_AVATAR_FOREST', 'PROFILE_BACKGROUND_MINT', 'TITLE_TASK_MASTER'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_FOREST',
      profileBackground: 'PROFILE_BACKGROUND_MINT',
      title: 'TITLE_TASK_MASTER'
    }
  },
  {
    loginId: 'community_user',
    itemCodes: ['PROFILE_AVATAR_SUNSET', 'TITLE_COMMUNITY_HELPER'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_SUNSET',
      title: 'TITLE_COMMUNITY_HELPER'
    }
  },
  {
    loginId: 'accessibility_user',
    itemCodes: ['PROFILE_BACKGROUND_NIGHT'],
    equipped: {
      profileBackground: 'PROFILE_BACKGROUND_NIGHT'
    }
  },
  {
    loginId: 'friend_user',
    itemCodes: ['PROFILE_AVATAR_SKY', 'TITLE_COMMUNITY_HELPER'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_SKY',
      title: 'TITLE_COMMUNITY_HELPER'
    }
  },
  {
    loginId: 'raid_user',
    itemCodes: ['PROFILE_AVATAR_NIGHT', 'PROFILE_BACKGROUND_NIGHT', 'TITLE_DEEP_FOCUS'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_NIGHT',
      profileBackground: 'PROFILE_BACKGROUND_NIGHT',
      title: 'TITLE_DEEP_FOCUS'
    }
  },
  {
    loginId: 'quest_user',
    itemCodes: ['PROFILE_AVATAR_FOREST', 'PROFILE_BACKGROUND_MINT', 'TITLE_TASK_MASTER'],
    equipped: {
      profileImage: 'PROFILE_AVATAR_FOREST',
      profileBackground: 'PROFILE_BACKGROUND_MINT',
      title: 'TITLE_TASK_MASTER'
    }
  }
];
const SEED_IDS = {
  posts: {
    question: 900001,
    proof: 900002,
    reported: 900003,
    resource: 900004,
    exam: 900005,
    encouragement: 900006
  },
  comments: {
    answer: 900011,
    proofReply: 900012,
    reported: 900013,
    resourceThanks: 900014,
    examTip: 900015,
    encouragementReply: 900016,
    secondAnswer: 900017
  },
  reports: {
    pendingPost: 900021,
    resolvedComment: 900022,
    dismissedPost: 900023,
    pendingComment: 900024,
    resolvedPost: 900025
  },
  challenges: {
    daily: 900031,
    weekend: 900032
  },
  notes: {
    architecture: 900041,
    async: 900042,
    database: 900043,
    english: 900044,
    math: 900045,
    beginnerMath: 900046,
    pdfMock: 900047,
    audioBriefing: 900048
  },
  aiQuestions: {
    architecture: 900051,
    async: 900052,
    studyPlan: 900053,
    quizHelp: 900054,
    voiceReview: 900055,
    beginnerMath: 900056,
    pdfSummary: 900057,
    audioBriefing: 900058
  },
  wrongAnswers: [900061, 900062, 900063, 900064],
  quizzes: {
    architecture: 900071,
    algorithm: 900072
  },
  quizQuestions: [900081, 900082, 900083, 900084, 900085],
  recommendations: {
    review: 900091,
    routine: 900092,
    exam: 900093,
    beginner: 900094,
    audioBriefing: 900095
  },
  friendships: {
    mainPeer: 900101,
    mainCommunity: 900102,
    mainRewardPending: 900103,
    accessMainPending: 900104,
    peerBeginnerRejected: 900105,
    mainFriend: 900106,
    friendRaid: 900107,
    questTeam01: 900108,
    team02QuestPending: 900109,
    team03FriendRejected: 900110
  },
  collaborativeQuests: {
    active: 900201,
    nearlyDone: 900202,
    completed: 900203,
    expired: 900204
  }
};

const SEED_BADGE_CODES = [
  'SAGAK_FIRST_FOCUS',
  'SAGAK_TASK_FINISHER',
  'SAGAK_STREAK_SPROUT',
  'SAGAK_COMMUNITY_HELPER',
  'SAGAK_ROUTINE_PENCIL',
  'SAGAK_QUIZ_LEAF'
];

const SEED_QUEST_CODES = [
  'QUEST_FOCUS_120',
  'QUEST_TASK_3',
  'QUEST_FOCUS_300',
  'QUEST_FOCUS_600',
  'QUEST_TASK_7',
  'QUEST_REVIEW_ROUTINE'
];

const SEED_BOSS_BADGE_CODES = [
  'SAGAK_BOSS_DAWN_SLAYER'
];

const SEED_BOSS_RAID_CODES = [
  'BOSS_DAWN_PENCIL',
  'BOSS_MIDNIGHT_GUARDIAN'
];

function looksLikeProductionUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.toLowerCase();
  return PRODUCTION_URL_PATTERNS.some((pattern) => normalizedValue.includes(pattern));
}

function assertSafeSeedEnvironment(env = process.env) {
  if (env.NODE_ENV === 'production') {
    throw new Error('Development seed cannot run when NODE_ENV is production');
  }

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Development seed requires ${missingKeys.join(', ')}`);
  }

  const productionLikeKeys = REQUIRED_ENV_KEYS.filter((key) => looksLikeProductionUrl(env[key]));

  if (productionLikeKeys.length > 0) {
    throw new Error(`Development seed refused production-like database setting: ${productionLikeKeys.join(', ')}`);
  }
}

function daysFromNow(days, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function minutesAfter(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function upsertSeedUser(prisma, seedUser, passwordHash) {
  return prisma.user.upsert({
    where: {
      loginId: seedUser.loginId
    },
    update: {
      name: seedUser.name,
      role: seedUser.role,
      userType: seedUser.userType,
      status: seedUser.status,
      passwordHash,
      profile: {
        upsert: {
          update: seedUser.profile,
          create: seedUser.profile
        }
      }
    },
    create: {
      loginId: seedUser.loginId,
      name: seedUser.name,
      role: seedUser.role,
      userType: seedUser.userType,
      status: seedUser.status,
      passwordHash,
      profile: {
        create: seedUser.profile
      }
    },
    select: {
      id: true,
      loginId: true,
      role: true
    }
  });
}

async function resetSeedData(prisma, seedUsers) {
  const userIds = seedUsers.map((user) => user.id);
  const postIds = Object.values(SEED_IDS.posts);
  const commentIds = Object.values(SEED_IDS.comments);
  const quizQuestionIds = SEED_IDS.quizQuestions;
  const friendshipIds = Object.values(SEED_IDS.friendships);
  const collaborativeQuestIds = Object.values(SEED_IDS.collaborativeQuests);

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { id: { in: friendshipIds } },
        { requesterId: { in: userIds } },
        { addresseeId: { in: userIds } }
      ]
    }
  });

  await prisma.communityReport.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(SEED_IDS.reports) } },
        { reporterId: { in: userIds } },
        { resolvedById: { in: userIds } },
        { postId: { in: postIds } },
        { commentId: { in: commentIds } }
      ]
    }
  });
  await prisma.communityBookmark.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { postId: { in: postIds } }
      ]
    }
  });
  await prisma.communityReaction.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { postId: { in: postIds } }
      ]
    }
  });
  await prisma.commentReaction.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { id: { in: commentIds } },
        { userId: { in: userIds } },
        { postId: { in: postIds } }
      ]
    }
  });
  await prisma.boardPost.deleteMany({
    where: {
      OR: [
        { id: { in: postIds } },
        { userId: { in: userIds } }
      ]
    }
  });

  await prisma.adminAction.deleteMany({
    where: {
      adminId: { in: userIds }
    }
  });
  await prisma.ranking.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { challengeId: { in: Object.values(SEED_IDS.challenges) } }
      ]
    }
  });
  await prisma.challengeMember.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { challengeId: { in: Object.values(SEED_IDS.challenges) } }
      ]
    }
  });
  await prisma.studyChallenge.deleteMany({
    where: {
      id: { in: Object.values(SEED_IDS.challenges) }
    }
  });
  await prisma.userShopPurchase.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });

  await prisma.bossRaidRewardClaim.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.bossRaidContribution.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.bossRaidPartyMember.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.bossRaidParty.deleteMany({
    where: {
      OR: [
        { ownerId: { in: userIds } },
        { raid: { code: { in: SEED_BOSS_RAID_CODES } } }
      ]
    }
  });
  await prisma.bossRaid.deleteMany({
    where: {
      code: { in: SEED_BOSS_RAID_CODES }
    }
  });

  await prisma.collaborativeQuestRewardClaim.deleteMany({
    where: {
      OR: [
        { questId: { in: collaborativeQuestIds } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.collaborativeQuestContribution.deleteMany({
    where: {
      OR: [
        { questId: { in: collaborativeQuestIds } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.collaborativeQuestParticipant.deleteMany({
    where: {
      OR: [
        { questId: { in: collaborativeQuestIds } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.collaborativeQuest.deleteMany({
    where: {
      OR: [
        { id: { in: collaborativeQuestIds } },
        { createdById: { in: userIds } }
      ]
    }
  });

  await prisma.pointTransaction.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.userQuest.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.userQuest.deleteMany({
    where: {
      quest: {
        code: { in: SEED_QUEST_CODES }
      }
    }
  });
  await prisma.userBadge.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.userBadge.deleteMany({
    where: {
      badge: {
        code: { in: [...SEED_BADGE_CODES, ...SEED_BOSS_BADGE_CODES] }
      }
    }
  });
  await prisma.rewardQuest.deleteMany({
    where: {
      code: { in: SEED_QUEST_CODES }
    }
  });
  await prisma.badge.deleteMany({
    where: {
      code: { in: [...SEED_BADGE_CODES, ...SEED_BOSS_BADGE_CODES] }
    }
  });

  await prisma.notification.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.voiceAccessibilityRequest.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.accessibilityPreference.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.studyStatistics.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.focusSession.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });

  await prisma.quizQuestion.deleteMany({
    where: {
      id: { in: quizQuestionIds }
    }
  });
  await prisma.quiz.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(SEED_IDS.quizzes) } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.wrongAnswerNote.deleteMany({
    where: {
      OR: [
        { id: { in: SEED_IDS.wrongAnswers } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.aIRecommendation.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(SEED_IDS.recommendations) } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.aIQuestion.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(SEED_IDS.aiQuestions) } },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.studyNote.deleteMany({
    where: {
      OR: [
        { id: { in: Object.values(SEED_IDS.notes) } },
        { userId: { in: userIds } }
      ]
    }
  });

  await prisma.studyTask.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.studySchedule.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
}

async function seedSchedulesAndTasks(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  const softwareReviewStart = daysFromNow(0, 19, 0);
  const algorithmStart = daysFromNow(1, 16, 30);
  const weeklyPlanStart = daysFromNow(3, 10, 0);
  const examPlanStart = daysFromNow(5, 9, 30);
  const pastReviewStart = daysFromNow(-2, 18, 0);
  const accessReviewStart = daysFromNow(0, 10, 0);
  const beginnerRoutineStart = daysFromNow(1, 17, 0);
  const friendPresenceStart = daysFromNow(0, 15, 30);
  const raidPlanStart = daysFromNow(1, 7, 30);
  const collaborativeQuestStart = daysFromNow(2, 20, 0);
  const teamReviewStart = daysFromNow(3, 19, 0);

  const softwareReview = await prisma.studySchedule.create({
    data: {
      userId: mainUser.id,
      title: '소프트웨어공학 발표 리허설',
      subject: '소프트웨어공학',
      startAt: softwareReviewStart,
      endAt: minutesAfter(softwareReviewStart, 90),
      priority: 'HIGH',
      memo: '요구사항부터 구현, 테스트, 데모 흐름까지 10분 발표로 정리'
    }
  });

  const algorithmReview = await prisma.studySchedule.create({
    data: {
      userId: mainUser.id,
      title: '알고리즘 오답 복습',
      subject: '자료구조',
      startAt: algorithmStart,
      endAt: minutesAfter(algorithmStart, 60),
      priority: 'MEDIUM',
      memo: '그래프 탐색과 정렬 문제를 다시 풀어보기'
    }
  });

  await prisma.studySchedule.create({
    data: {
      userId: rewardUser.id,
      title: '보상 대시보드 데모 확인',
      subject: '서비스 테스트',
      startAt: weeklyPlanStart,
      endAt: minutesAfter(weeklyPlanStart, 45),
      priority: 'LOW',
      memo: '퀘스트 진행률, 포인트, 배지 표시 확인'
    }
  });

  const examPlan = await prisma.studySchedule.create({
    data: {
      userId: mainUser.id,
      title: '기말 시험 대비 범위 쪼개기',
      subject: '소프트웨어공학',
      startAt: examPlanStart,
      endAt: minutesAfter(examPlanStart, 120),
      priority: 'HIGH',
      memo: '요구사항, 설계, 구현, 테스트 보고서 순서로 D-Day 역산 계획 정리'
    }
  });

  const pastReview = await prisma.studySchedule.create({
    data: {
      userId: peerUser.id,
      title: '지난 스터디 회고 정리',
      subject: '프로젝트 관리',
      startAt: pastReviewStart,
      endAt: minutesAfter(pastReviewStart, 50),
      priority: 'LOW',
      memo: '완료한 작업과 다음 PR 준비 사항을 짧게 정리'
    }
  });

  const communityShare = await prisma.studySchedule.create({
    data: {
      userId: communityUser.id,
      title: '영어 단어 암기 자료 공유 준비',
      subject: '영어',
      startAt: daysFromNow(2, 8, 30),
      endAt: minutesAfter(daysFromNow(2, 8, 30), 45),
      priority: 'MEDIUM',
      memo: '커뮤니티 자료 공유 게시글에 올릴 핵심 단어와 예문 정리'
    }
  });

  const accessReview = await prisma.studySchedule.create({
    data: {
      userId: accessUser.id,
      title: '음성 안내로 복습 내용 확인',
      subject: '생활 영어',
      startAt: accessReviewStart,
      endAt: minutesAfter(accessReviewStart, 30),
      priority: 'MEDIUM',
      memo: '큰 글씨와 음성 출력 설정을 켠 상태로 짧은 복습 진행'
    }
  });

  const beginnerRoutine = await prisma.studySchedule.create({
    data: {
      userId: beginnerUser.id,
      title: '수학 개념 25분 루틴 만들기',
      subject: '수학',
      startAt: beginnerRoutineStart,
      endAt: minutesAfter(beginnerRoutineStart, 25),
      priority: 'LOW',
      memo: '처음 사용하는 사용자가 프로필과 통계 화면에서 작은 기록을 확인할 수 있게 하는 데모 일정'
    }
  });

  const friendPresenceSchedule = await prisma.studySchedule.create({
    data: {
      userId: friendUser.id,
      title: '친구 접속 상태 수동 QA',
      subject: '협업 학습',
      startAt: friendPresenceStart,
      endAt: minutesAfter(friendPresenceStart, 40),
      priority: 'MEDIUM',
      memo: '친구 목록, 요청 상태, WebSocket presence fallback 흐름 확인'
    }
  });

  const raidPlan = await prisma.studySchedule.create({
    data: {
      userId: raidUser.id,
      title: '보스 레이드 진행률 점검',
      subject: '집중 학습',
      startAt: raidPlanStart,
      endAt: minutesAfter(raidPlanStart, 75),
      priority: 'HIGH',
      memo: '레이드 파티 참여, 기여도, 완료/보상 상태를 순서대로 확인'
    }
  });

  const collaborativeQuestPlan = await prisma.studySchedule.create({
    data: {
      userId: questUser.id,
      title: '협동 퀘스트 진행률 QA',
      subject: '프로젝트 학습',
      startAt: collaborativeQuestStart,
      endAt: minutesAfter(collaborativeQuestStart, 60),
      priority: 'HIGH',
      memo: '협동 퀘스트 참여, 기여도 추가, 완료 후 보상 수령 상태 점검'
    }
  });

  const teamReviewPlan = await prisma.studySchedule.create({
    data: {
      userId: teamUser01.id,
      title: '팀 데모 리허설 및 smoke test',
      subject: '서비스 운영',
      startAt: teamReviewStart,
      endAt: minutesAfter(teamReviewStart, 90),
      priority: 'HIGH',
      memo: 'Vercel/Render 배포 후 핵심 화면을 실제 사용자처럼 확인'
    }
  });

  const tasks = [];
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: mainUser.id,
      scheduleId: softwareReview.id,
      title: '설계 문서 핵심 다이어그램 다시 보기',
      status: 'DONE',
      dueDate: daysFromNow(0, 21, 0),
      priority: 'HIGH',
      memo: '클래스/시퀀스 다이어그램과 실제 구현 연결 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: mainUser.id,
      scheduleId: softwareReview.id,
      title: '발표 데모 순서 체크리스트 작성',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(1, 12, 0),
      priority: 'HIGH',
      memo: '로그인, 대시보드, 커뮤니티, 보상, 접근성 순서로 점검'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: mainUser.id,
      scheduleId: algorithmReview.id,
      title: 'BFS/DFS 오답 3문제 복습',
      status: 'TODO',
      dueDate: daysFromNow(2, 18, 0),
      priority: 'MEDIUM',
      memo: '틀린 이유를 오답노트에 짧게 기록'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: rewardUser.id,
      title: '퀘스트 수령 상태 확인',
      status: 'DONE',
      dueDate: daysFromNow(-1, 18, 0),
      priority: 'MEDIUM',
      memo: '보상 데모용 완료 태스크'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: mainUser.id,
      scheduleId: examPlan.id,
      title: '요구사항 ID와 구현 화면 매칭표 만들기',
      status: 'TODO',
      dueDate: daysFromNow(4, 22, 0),
      priority: 'HIGH',
      memo: 'FR-24 보상, FR-20 접근성, 커뮤니티 기능을 발표 흐름에 맞춰 정리'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: mainUser.id,
      scheduleId: examPlan.id,
      title: '테스트 보고서 수치 확인',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(3, 20, 0),
      priority: 'MEDIUM',
      memo: '전체 테스트 수와 주요 단일 테스트 범위를 발표 전 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: peerUser.id,
      scheduleId: pastReview.id,
      title: '회의록에서 결정 사항만 추려 보기',
      status: 'DONE',
      dueDate: daysFromNow(-1, 17, 0),
      priority: 'LOW',
      memo: '완료된 작업과 후속 Issue를 구분'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: communityUser.id,
      scheduleId: communityShare.id,
      title: '자료 공유 게시글 초안 작성',
      status: 'TODO',
      dueDate: daysFromNow(2, 12, 0),
      priority: 'MEDIUM',
      memo: '예문 5개와 암기 팁 3개를 포함'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: accessUser.id,
      scheduleId: accessReview.id,
      title: '큰 글씨 모드에서 복습 문장 읽기',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(0, 11, 0),
      priority: 'MEDIUM',
      memo: '고대비와 음성 출력 설정을 함께 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: accessUser.id,
      title: '복습 알림 문구 다시 듣기',
      status: 'TODO',
      dueDate: daysFromNow(1, 20, 30),
      priority: 'LOW',
      memo: '알림 문구가 너무 길지 않은지 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: beginnerUser.id,
      scheduleId: beginnerRoutine.id,
      title: '분수 덧셈 예제 2개 풀기',
      status: 'TODO',
      dueDate: daysFromNow(1, 18, 0),
      priority: 'LOW',
      memo: '초보 루틴 사용자용 첫 태스크'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: beginnerUser.id,
      scheduleId: beginnerRoutine.id,
      title: '오늘 배운 개념 한 줄 기록',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(1, 19, 0),
      priority: 'LOW',
      memo: '프로필 최근 활동과 칸반 데모 확인용'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: beginnerUser.id,
      title: '어제 복습한 문제 체크',
      status: 'DONE',
      dueDate: daysFromNow(-1, 17, 0),
      priority: 'LOW',
      memo: '완료 태스크가 0개로 보이지 않도록 하는 초보 사용자 데모 데이터'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: friendUser.id,
      scheduleId: friendPresenceSchedule.id,
      title: '친구 목록 온라인 배지 확인',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(0, 16, 20),
      priority: 'MEDIUM',
      memo: '여러 계정 로그인 상태에서 친구 접속 표시와 HTTP fallback을 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: raidUser.id,
      scheduleId: raidPlan.id,
      title: '레이드 진행률 이벤트 수동 QA',
      status: 'TODO',
      dueDate: daysFromNow(1, 9, 0),
      priority: 'HIGH',
      memo: '보스 레이드 파티의 50%, 90%, 100% 진행 상태를 비교'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: questUser.id,
      scheduleId: collaborativeQuestPlan.id,
      title: '협동 퀘스트 기여도 추가 확인',
      status: 'TODO',
      dueDate: daysFromNow(2, 21, 0),
      priority: 'HIGH',
      memo: '기여도 추가 후 실시간 progress bar와 보상 버튼 상태 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: teamUser01.id,
      scheduleId: teamReviewPlan.id,
      title: '배포 smoke test 체크리스트 작성',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(3, 22, 0),
      priority: 'HIGH',
      memo: '로그인, 커뮤니티, 상점, 레이드, 협동 퀘스트, 점검 모드 순서로 점검'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: teamUser02.id,
      title: '협동 퀘스트 데모 데이터 검수',
      status: 'DONE',
      dueDate: daysFromNow(-1, 18, 0),
      priority: 'MEDIUM',
      memo: '완료/진행/만료 퀘스트가 화면에서 구분되는지 확인'
    }
  }));
  tasks.push(await prisma.studyTask.create({
    data: {
      userId: teamUser03.id,
      title: '최종 발표용 기능 흐름 메모',
      status: 'TODO',
      dueDate: daysFromNow(4, 20, 0),
      priority: 'MEDIUM',
      memo: '버전 태그, Release, CI/CD, seed 운영 기준을 발표 흐름에 맞춰 정리'
    }
  }));

  return tasks;
}

async function seedFriendships(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  await prisma.friendship.createMany({
    data: [
      {
        id: SEED_IDS.friendships.mainPeer,
        requesterId: mainUser.id,
        addresseeId: peerUser.id,
        status: 'ACCEPTED',
        createdAt: daysFromNow(-18, 9, 0),
        updatedAt: daysFromNow(-17, 18, 0)
      },
      {
        id: SEED_IDS.friendships.mainCommunity,
        requesterId: communityUser.id,
        addresseeId: mainUser.id,
        status: 'ACCEPTED',
        createdAt: daysFromNow(-10, 12, 10),
        updatedAt: daysFromNow(-9, 20, 15)
      },
      {
        id: SEED_IDS.friendships.mainRewardPending,
        requesterId: mainUser.id,
        addresseeId: rewardUser.id,
        status: 'PENDING',
        createdAt: daysFromNow(-1, 21, 0),
        updatedAt: daysFromNow(-1, 21, 0)
      },
      {
        id: SEED_IDS.friendships.accessMainPending,
        requesterId: accessUser.id,
        addresseeId: mainUser.id,
        status: 'PENDING',
        createdAt: daysFromNow(0, 8, 30),
        updatedAt: daysFromNow(0, 8, 30)
      },
      {
        id: SEED_IDS.friendships.peerBeginnerRejected,
        requesterId: peerUser.id,
        addresseeId: beginnerUser.id,
        status: 'REJECTED',
        createdAt: daysFromNow(-5, 15, 0),
        updatedAt: daysFromNow(-4, 19, 0)
      },
      {
        id: SEED_IDS.friendships.mainFriend,
        requesterId: friendUser.id,
        addresseeId: mainUser.id,
        status: 'ACCEPTED',
        createdAt: daysFromNow(-6, 10, 0),
        updatedAt: daysFromNow(-6, 10, 30)
      },
      {
        id: SEED_IDS.friendships.friendRaid,
        requesterId: friendUser.id,
        addresseeId: raidUser.id,
        status: 'ACCEPTED',
        createdAt: daysFromNow(-4, 13, 0),
        updatedAt: daysFromNow(-4, 13, 20)
      },
      {
        id: SEED_IDS.friendships.questTeam01,
        requesterId: questUser.id,
        addresseeId: teamUser01.id,
        status: 'ACCEPTED',
        createdAt: daysFromNow(-3, 19, 0),
        updatedAt: daysFromNow(-3, 19, 30)
      },
      {
        id: SEED_IDS.friendships.team02QuestPending,
        requesterId: teamUser02.id,
        addresseeId: questUser.id,
        status: 'PENDING',
        createdAt: daysFromNow(-1, 12, 0),
        updatedAt: daysFromNow(-1, 12, 0)
      },
      {
        id: SEED_IDS.friendships.team03FriendRejected,
        requesterId: teamUser03.id,
        addresseeId: friendUser.id,
        status: 'REJECTED',
        createdAt: daysFromNow(-2, 14, 0),
        updatedAt: daysFromNow(-2, 14, 20)
      }
    ],
    skipDuplicates: true
  });
}

async function seedFocusAndStatistics(prisma, usersByLoginId, tasks) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];
  const mainTask = tasks[0];
  const mainFocusMinutes = [
    35, 0, 55, 80, 0, 110, 45,
    25, 65, 0, 90, 35, 120, 40,
    0, 70, 95, 30, 0, 105, 55,
    45, 25, 80, 35, 95, 20, 60
  ];
  const mainFocusHours = [
    9, 0, 20, 18, 0, 10, 21,
    7, 19, 0, 22, 12, 9, 16,
    0, 20, 18, 7, 0, 21, 10,
    9, 21, 18, 7, 20, 12, 19
  ];

  for (let index = 0; index < mainFocusMinutes.length; index += 1) {
    const duration = mainFocusMinutes[index];

    if (duration <= 0) {
      continue;
    }

    const startedAt = daysFromNow(index - 27, mainFocusHours[index], index % 2 === 0 ? 0 : 30);
    await prisma.focusSession.create({
      data: {
        userId: mainUser.id,
        taskId: index % 2 === 0 ? mainTask.id : null,
        startedAt,
        endedAt: minutesAfter(startedAt, duration),
        durationMs: duration * 60 * 1000,
        memo: `${duration}분 집중 학습`
      }
    });
  }

  const todayShortFocus = daysFromNow(0, 8, 20);
  await prisma.focusSession.create({
    data: {
      userId: mainUser.id,
      taskId: tasks[5].id,
      startedAt: todayShortFocus,
      endedAt: minutesAfter(todayShortFocus, 18),
      durationMs: 18 * 60 * 1000,
      memo: '등교 전 짧은 개념 복습'
    }
  });

  const todayDeepFocus = daysFromNow(0, 22, 0);
  await prisma.focusSession.create({
    data: {
      userId: mainUser.id,
      taskId: tasks[4].id,
      startedAt: todayDeepFocus,
      endedAt: minutesAfter(todayDeepFocus, 90),
      durationMs: 90 * 60 * 1000,
      memo: '기말 대비 범위 쪼개기 집중'
    }
  });

  const rewardStartedAt = daysFromNow(-1, 21, 0);
  await prisma.focusSession.create({
    data: {
      userId: rewardUser.id,
      taskId: tasks[3].id,
      startedAt: rewardStartedAt,
      endedAt: minutesAfter(rewardStartedAt, 130),
      durationMs: 130 * 60 * 1000,
      memo: '보상 퀘스트 달성용 집중 세션'
    }
  });

  const peerFocusStartedAt = daysFromNow(-2, 14, 0);
  await prisma.focusSession.create({
    data: {
      userId: peerUser.id,
      taskId: tasks[6].id,
      startedAt: peerFocusStartedAt,
      endedAt: minutesAfter(peerFocusStartedAt, 45),
      durationMs: 45 * 60 * 1000,
      memo: '스터디 회고 정리 집중'
    }
  });

  const accessFocusStartedAt = daysFromNow(0, 10, 15);
  await prisma.focusSession.create({
    data: {
      userId: accessUser.id,
      taskId: tasks[8].id,
      startedAt: accessFocusStartedAt,
      endedAt: minutesAfter(accessFocusStartedAt, 28),
      durationMs: 28 * 60 * 1000,
      memo: '큰 글씨 모드 복습 세션'
    }
  });

  const communityFocusBlocks = [
    { days: -6, hour: 8, minutes: 35, taskIndex: 7, memo: '자료 공유 전 아침 영어 예문 정리' },
    { days: -3, hour: 22, minutes: 55, taskIndex: 7, memo: '커뮤니티 댓글 답변을 위한 문법 복습' },
    { days: -1, hour: 18, minutes: 40, taskIndex: 7, memo: '시험 대비 자료 카드 정리' }
  ];

  for (const block of communityFocusBlocks) {
    const startedAt = daysFromNow(block.days, block.hour, 10);
    await prisma.focusSession.create({
      data: {
        userId: communityUser.id,
        taskId: tasks[block.taskIndex]?.id || null,
        startedAt,
        endedAt: minutesAfter(startedAt, block.minutes),
        durationMs: block.minutes * 60 * 1000,
        memo: block.memo
      }
    });
  }

  const beginnerFocusBlocks = [
    { days: -4, hour: 17, minutes: 12, taskIndex: 11, memo: '처음 시작한 짧은 복습' },
    { days: -2, hour: 17, minutes: 18, taskIndex: 11, memo: '분수 덧셈 예제 풀이' },
    { days: 0, hour: 17, minutes: 25, taskIndex: 10, memo: '25분 루틴 첫 성공' }
  ];

  for (const block of beginnerFocusBlocks) {
    const startedAt = daysFromNow(block.days, block.hour, 0);
    await prisma.focusSession.create({
      data: {
        userId: beginnerUser.id,
        taskId: tasks[block.taskIndex]?.id || null,
        startedAt,
        endedAt: minutesAfter(startedAt, block.minutes),
        durationMs: block.minutes * 60 * 1000,
        memo: block.memo
      }
    });
  }

  const realtimeQaFocusBlocks = [
    {
      user: friendUser,
      taskTitle: '친구 목록 온라인 배지 확인',
      days: 0,
      hour: 15,
      minutes: 32,
      memo: '친구 접속 상태와 presence fallback 확인'
    },
    {
      user: raidUser,
      taskTitle: '레이드 진행률 이벤트 수동 QA',
      days: -1,
      hour: 7,
      minutes: 95,
      memo: '보스 레이드 진행률 90% 구간 확인용 집중'
    },
    {
      user: questUser,
      taskTitle: '협동 퀘스트 기여도 추가 확인',
      days: -1,
      hour: 20,
      minutes: 70,
      memo: '협동 퀘스트 기여도 seed 기준 집중'
    },
    {
      user: teamUser01,
      taskTitle: '배포 smoke test 체크리스트 작성',
      days: 0,
      hour: 19,
      minutes: 45,
      memo: '최신 배포 smoke test 체크리스트 작성'
    },
    {
      user: teamUser02,
      taskTitle: '협동 퀘스트 데모 데이터 검수',
      days: -2,
      hour: 18,
      minutes: 55,
      memo: '협동 퀘스트 완료 상태 검수'
    },
    {
      user: teamUser03,
      taskTitle: '최종 발표용 기능 흐름 메모',
      days: -1,
      hour: 21,
      minutes: 30,
      memo: '릴리즈와 seed 운영 흐름 발표 메모'
    }
  ];

  for (const block of realtimeQaFocusBlocks) {
    const startedAt = daysFromNow(block.days, block.hour, 0);
    const task = tasks.find((candidate) => candidate.title === block.taskTitle);
    await prisma.focusSession.create({
      data: {
        userId: block.user.id,
        taskId: task?.id || null,
        startedAt,
        endedAt: minutesAfter(startedAt, block.minutes),
        durationMs: block.minutes * 60 * 1000,
        memo: block.memo
      }
    });
  }

  await prisma.studyStatistics.create({
    data: {
      userId: mainUser.id,
      periodStart: daysFromNow(-27, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: mainFocusMinutes.reduce((sum, minutes) => sum + minutes, 0) + 108,
      completionRate: 0.72,
      statisticsJson: {
        dailyMinutes: mainFocusMinutes,
        todayMinutes: 108,
        longestSessionMinutes: 120,
        pattern: '꾸준형',
        summary: '4주 동안 쉬는 날과 긴 집중일이 섞여 있고, 평일 저녁 집중 시간이 강함'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: peerUser.id,
      periodStart: daysFromNow(-27, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 45,
      completionRate: 0.4,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0],
        pattern: '회고 중심',
        summary: '스터디 회고와 커뮤니티 확인 중심의 가벼운 활동 데이터'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: communityUser.id,
      periodStart: daysFromNow(-27, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 130,
      completionRate: 0.55,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35, 0, 0, 55, 0, 40, 0],
        pattern: '커뮤니티 참여형',
        summary: '학습 자료 공유 전후로 짧은 집중 기록이 분산되어 있음'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: rewardUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 130,
      completionRate: 0.5,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 130, 0],
        pattern: '퀘스트 달성형',
        summary: '보상 데모 사용자는 퀘스트 수령 흐름을 확인하기 위한 집중 시간이 있음'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: accessUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 28,
      completionRate: 0.25,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28],
        pattern: '접근성 복습형',
        summary: '접근성 설정 사용자는 오늘 짧은 음성 복습 세션을 진행함'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: beginnerUser.id,
      periodStart: daysFromNow(-27, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 55,
      completionRate: 0.33,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 18, 0, 25],
        todayMinutes: 25,
        pattern: '초보 루틴형',
        summary: '아직 기록은 적지만 25분 루틴을 시작한 신규 사용자 흐름'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: friendUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 32,
      completionRate: 0.5,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32],
        todayMinutes: 32,
        pattern: '친구 협업 확인형',
        summary: '친구 목록과 접속 상태 흐름을 확인하기 위한 짧은 학습 기록'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: raidUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 95,
      completionRate: 0.66,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 95, 0],
        pattern: '레이드 집중형',
        summary: '보스 레이드 진행률 데모와 연결되는 집중 기록'
      }
    }
  });

  await prisma.studyStatistics.create({
    data: {
      userId: questUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: 70,
      completionRate: 0.6,
      statisticsJson: {
        dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 0],
        pattern: '협동 퀘스트 기여형',
        summary: '협동 퀘스트 진행률과 보상 수령 흐름을 확인하기 위한 학습 기록'
      }
    }
  });

  await prisma.studyStatistics.createMany({
    data: [
      {
        userId: teamUser01.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        totalMinutes: 45,
        completionRate: 0.5,
        statisticsJson: {
          dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45],
          pattern: '팀 QA 리더형'
        }
      },
      {
        userId: teamUser02.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        totalMinutes: 55,
        completionRate: 1,
        statisticsJson: {
          dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0],
          pattern: '협동 검수 완료형'
        }
      },
      {
        userId: teamUser03.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        totalMinutes: 30,
        completionRate: 0.2,
        statisticsJson: {
          dailyMinutes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0],
          pattern: '발표 준비형'
        }
      }
    ]
  });
}

async function seedCommunity(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];
  const adminUser = usersByLoginId['admin_user'];

  const questionPost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.question,
      userId: mainUser.id,
      category: 'QUESTION',
      title: '설계 문서와 API 구현을 어떻게 연결하면 좋을까요?',
      content: '시퀀스 다이어그램의 흐름을 Express controller/service/repository 구조와 맞춰 정리하고 있습니다.',
      reported: false
    }
  });

  const proofPost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.proof,
      userId: peerUser.id,
      category: 'STUDY_PROOF',
      title: '오늘 90분 집중 학습 인증',
      content: '타이머 기록과 칸반 완료 태스크를 함께 확인했습니다.',
      reported: false
    }
  });

  const reportedPost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.reported,
      userId: rewardUser.id,
      category: 'FREE',
      title: '관리자 신고 처리 데모용 게시글',
      content: '신고 처리 화면에서 상태 변경을 확인하기 위한 개발용 게시글입니다.',
      reported: true
    }
  });

  const resourcePost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.resource,
      userId: communityUser.id,
      category: 'FREE',
      title: '영어 단어 암기용 예문 자료 공유',
      content: '오늘 외운 단어 10개와 짧은 예문을 정리했습니다. 시험 전 빠르게 훑기 좋게 만들었습니다.',
      reported: false
    }
  });

  const examPost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.exam,
      userId: mainUser.id,
      category: 'QUESTION',
      title: '기말 시험 범위는 어떻게 쪼개서 보면 좋을까요?',
      content: '남은 기간이 짧아서 요구사항, 설계, 구현, 테스트를 어떤 순서로 복습할지 고민 중입니다.',
      reported: false
    }
  });

  const encouragementPost = await prisma.boardPost.create({
    data: {
      id: SEED_IDS.posts.encouragement,
      userId: accessUser.id,
      category: 'STUDY_PROOF',
      title: '큰 글씨 모드로 오늘 복습 완료',
      content: '짧은 복습이지만 음성 안내와 큰 글씨 설정을 켜고 끝까지 마쳤습니다.',
      reported: false
    }
  });

  const expandedPostSeeds = [
    {
      loginId: 'dev_user',
      category: 'QUESTION',
      title: '요구사항 추적표를 발표에서 어떻게 설명하면 좋을까요?',
      content: 'FR/UC 연결을 보여주려는데 너무 문서 중심으로 보일까 봐 걱정입니다. 화면 흐름과 함께 설명하는 팁이 있을까요?',
      viewCount: 143,
      days: -18,
      hour: 9
    },
    {
      loginId: 'study_peer',
      category: 'FREE',
      title: '다국어 QA하면서 발견한 문구 체크 방식 공유',
      content: '언어를 바꾼 뒤 새로고침하고 버튼, 빈 상태, 오류 메시지를 한 화면씩 보는 방식이 가장 빠르게 누락을 찾았습니다.',
      viewCount: 89,
      days: -17,
      hour: 21
    },
    {
      loginId: 'community_user',
      category: 'STUDY_PROOF',
      title: '커뮤니티 댓글 정리하고 40분 집중했습니다',
      content: '질문 글에 답변을 남기고, 북마크한 자료를 다시 보면서 짧게 복습했습니다.',
      viewCount: 126,
      days: -16,
      hour: 18
    },
    {
      loginId: 'reward_user',
      category: 'QUESTION',
      title: '포인트 상점 칭호는 어떤 기준으로 고르면 좋을까요?',
      content: '프로필에서 보이는 칭호가 너무 튀지 않으면서도 학습 동기를 줄 수 있는 기준을 고민 중입니다.',
      viewCount: 71,
      days: -15,
      hour: 14
    },
    {
      loginId: 'accessibility_user',
      category: 'FREE',
      title: '읽어주기 목소리 미리듣기 사용 후기',
      content: '목소리마다 속도와 높낮이가 조금 달라서 미리듣기 버튼이 있으면 설정을 고르기 훨씬 편합니다.',
      viewCount: 64,
      days: -14,
      hour: 11
    },
    {
      loginId: 'beginner_user',
      category: 'QUESTION',
      title: '1초 퀴즈는 하루에 몇 번 보는 게 적당할까요?',
      content: '너무 자주 나오면 부담스럽고, 한 번만 나오면 잊어버릴 것 같아서 적당한 빈도를 찾고 있습니다.',
      viewCount: 52,
      days: -13,
      hour: 20
    },
    {
      loginId: 'dev_user',
      category: 'STUDY_PROOF',
      title: 'D-Day 계획으로 태스크 8개 나눠서 완료',
      content: '마감일 기준으로 범위를 나누고 오늘 해야 할 분량만 칸반에서 처리했습니다.',
      viewCount: 157,
      days: -12,
      hour: 22
    },
    {
      loginId: 'study_peer',
      category: 'QUESTION',
      title: '통계 그래프에서 가장 집중한 요일을 어떻게 해석하나요?',
      content: '히트맵과 막대그래프는 보이는데, 주간 패턴 문구를 발표 때 어떻게 설명하면 좋을지 궁금합니다.',
      viewCount: 118,
      days: -11,
      hour: 13
    },
    {
      loginId: 'community_user',
      category: 'FREE',
      title: '시험 전날 체크리스트 템플릿 공유',
      content: '범위 확인, 오답노트 3개, 25분 집중 2회, 잠들기 전 10분 복습으로 구성했습니다.',
      viewCount: 201,
      days: -10,
      hour: 8
    },
    {
      loginId: 'reward_user',
      category: 'STUDY_PROOF',
      title: '퀘스트 보상 받고 프로필 배경 적용 완료',
      content: '보상 포인트를 모아 민트 배경을 적용했습니다. 작은 변화지만 프로필 확인이 더 즐거워졌습니다.',
      viewCount: 96,
      days: -9,
      hour: 19
    },
    {
      loginId: 'accessibility_user',
      category: 'QUESTION',
      title: '큰 글씨 모드에서 표 보기와 카드 보기 중 어떤 게 편한가요?',
      content: '커뮤니티 목록을 볼 때 큰 글씨 상태에서는 카드가 편한지 표가 편한지 의견을 듣고 싶습니다.',
      viewCount: 81,
      days: -8,
      hour: 16
    },
    {
      loginId: 'beginner_user',
      category: 'FREE',
      title: '처음으로 북마크 기능을 써봤습니다',
      content: '자주 볼 질문 글을 저장해 두니 마이페이지에서 다시 찾기 쉬웠습니다.',
      viewCount: 44,
      days: -7,
      hour: 17
    },
    {
      loginId: 'dev_user',
      category: 'QUESTION',
      title: 'AI mock 응답과 실제 AI 응답을 발표에서 어떻게 구분할까요?',
      content: '현재는 demo/mock 흐름이라 실제 외부 AI 호출이 없다는 점을 명확하게 말하려고 합니다.',
      viewCount: 173,
      days: -6,
      hour: 10
    },
    {
      loginId: 'study_peer',
      category: 'STUDY_PROOF',
      title: '친구 요청 정리하고 주간 목표를 다시 잡았습니다',
      content: '친구 목록을 확인한 뒤 이번 주에는 짧은 집중 기록을 매일 남기기로 했습니다.',
      viewCount: 67,
      days: -5,
      hour: 12
    },
    {
      loginId: 'community_user',
      category: 'QUESTION',
      title: '검색어 기록은 몇 개 정도가 적당할까요?',
      content: '최근 검색어가 너무 많으면 오히려 복잡해 보여서 5개 정도가 적당한지 고민 중입니다.',
      viewCount: 101,
      days: -4,
      hour: 15
    },
    {
      loginId: 'reward_user',
      category: 'FREE',
      title: '상점 아이템 가격 밸런스 의견 받습니다',
      content: '프로필 이미지와 배경, 칭호 가격 차이가 너무 크지 않도록 조정 기준을 정리해 보고 있습니다.',
      viewCount: 58,
      days: -3,
      hour: 21
    },
    {
      loginId: 'accessibility_user',
      category: 'STUDY_PROOF',
      title: '음성 안내 켜고 일정 2개 정리했습니다',
      content: '오늘은 큰 글씨와 읽어주기를 함께 켜고 일정 화면을 정리했습니다.',
      viewCount: 73,
      days: -2,
      hour: 9
    },
    {
      loginId: 'beginner_user',
      category: 'QUESTION',
      title: '마이페이지 활동 통계는 어떤 기준인가요?',
      content: '좋아요 수가 내가 받은 것인지 내가 누른 것인지 헷갈려서 기준 설명이 있으면 좋겠습니다.',
      viewCount: 132,
      days: -1,
      hour: 18
    },
    {
      loginId: 'friend_user',
      category: 'FREE',
      title: '친구 접속 상태 배지는 언제 바뀌나요?',
      content: 'WebSocket 연결이 끊겼을 때도 화면이 멈추지 않고 다시 확인할 수 있는지 테스트하고 있습니다.',
      viewCount: 188,
      days: -1,
      hour: 20
    },
    {
      loginId: 'raid_user',
      category: 'STUDY_PROOF',
      title: '보스 레이드 진행률 90% 구간까지 확인했습니다',
      content: '파티원별 기여도와 남은 HP가 같이 보이니 수동 QA 흐름을 설명하기 좋았습니다.',
      viewCount: 241,
      days: 0,
      hour: 8
    },
    {
      loginId: 'quest_user',
      category: 'QUESTION',
      title: '협동 퀘스트 보상은 언제 수령할 수 있나요?',
      content: '진행률이 100%가 된 뒤 참여자별로 한 번만 claim되는지 확인하고 싶습니다.',
      viewCount: 219,
      days: 0,
      hour: 13
    },
    {
      loginId: 'team_user_01',
      category: 'FREE',
      title: '배포 후 smoke test 순서 공유',
      content: '로그인, 대시보드, 커뮤니티, 보상, 레이드, 협동 퀘스트, 점검 모드 순서로 직접 눌러보면 좋겠습니다.',
      viewCount: 176,
      days: 0,
      hour: 16
    },
    {
      loginId: 'team_user_02',
      category: 'STUDY_PROOF',
      title: '릴리즈 v2.4.0 기준 실시간 기능 QA 완료',
      content: '커뮤니티 댓글 알림, 친구 접속 상태, 레이드/협동 퀘스트 진행률을 한 번씩 확인했습니다.',
      viewCount: 205,
      days: 0,
      hour: 18
    }
  ];

  const expandedPosts = [];

  for (const seed of expandedPostSeeds) {
    const author = usersByLoginId[seed.loginId];
    const post = await prisma.boardPost.create({
      data: {
        userId: author.id,
        category: seed.category,
        title: seed.title,
        content: seed.content,
        viewCount: seed.viewCount,
        reported: false,
        createdAt: daysFromNow(seed.days, seed.hour, 0)
      }
    });

    expandedPosts.push({
      post,
      authorLoginId: seed.loginId
    });
  }

  const answerComment = await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.answer,
      postId: questionPost.id,
      userId: peerUser.id,
      content: '요구사항 ID와 테스트 케이스를 같이 적어두면 추적하기 쉽습니다.',
      reported: false
    }
  });

  await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.proofReply,
      postId: proofPost.id,
      userId: mainUser.id,
      content: '좋은 인증입니다. 내일은 복습 알림도 같이 확인해 보겠습니다.',
      reported: false
    }
  });

  const reportedComment = await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.reported,
      postId: reportedPost.id,
      userId: peerUser.id,
      content: '관리자 댓글 신고 처리 데모용 댓글입니다.',
      reported: true
    }
  });

  const resourceThanksComment = await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.resourceThanks,
      postId: resourcePost.id,
      userId: peerUser.id,
      content: '예문이 짧아서 이동 중에 보기 좋습니다. 북마크해 둘게요.',
      reported: false
    }
  });

  await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.examTip,
      postId: examPost.id,
      userId: rewardUser.id,
      content: '처음에는 요구사항-설계 연결을 보고, 마지막에 테스트 결과를 맞춰 보는 순서가 좋았습니다.',
      reported: false
    }
  });

  await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.encouragementReply,
      postId: encouragementPost.id,
      userId: mainUser.id,
      content: '좋은 루틴입니다. 복습 알림이 길면 짧게 나눠서 들어도 좋겠습니다.',
      reported: false
    }
  });

  await prisma.comment.create({
    data: {
      id: SEED_IDS.comments.secondAnswer,
      postId: questionPost.id,
      userId: communityUser.id,
      content: '문서 링크와 실제 API endpoint를 함께 적어두면 발표 때 설명이 자연스럽습니다.',
      reported: false
    }
  });

  const reactionUsers = [
    mainUser,
    peerUser,
    friendUser,
    communityUser,
    rewardUser,
    raidUser,
    questUser,
    teamUser01,
    teamUser02,
    teamUser03,
    accessUser,
    beginnerUser
  ];
  const expandedComments = [];

  for (let index = 0; index < expandedPosts.length; index += 1) {
    const { post, authorLoginId } = expandedPosts[index];
    const commentAuthor = reactionUsers.find((candidate) => candidate.loginId !== authorLoginId) || peerUser;
    const replyAuthor = reactionUsers.find((candidate) => candidate.id !== commentAuthor.id && candidate.loginId !== authorLoginId) || mainUser;
    const comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: commentAuthor.id,
        content: index % 2 === 0
          ? '이 흐름이면 발표 때도 바로 설명하기 좋겠습니다. 북마크해 두겠습니다.'
          : '실제 화면에서 확인할 수 있는 예시라서 데모 때 쓰기 좋겠습니다.',
        reported: false,
        createdAt: daysFromNow(-Math.max(1, 17 - index), 10 + (index % 8), 20)
      }
    });
    const reply = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: replyAuthor.id,
        parentId: comment.id,
        content: index % 3 === 0
          ? '대답글까지 연결해 두면 토론 흐름이 더 잘 보입니다.'
          : '이 기준으로 한 번 더 정리해 보겠습니다.',
        reported: false,
        createdAt: daysFromNow(-Math.max(1, 16 - index), 11 + (index % 7), 35)
      }
    });

    expandedComments.push(comment, reply);

    if (index % 4 === 0) {
      const secondCommentAuthor = reactionUsers.find(
        (candidate) => candidate.id !== commentAuthor.id && candidate.id !== replyAuthor.id && candidate.loginId !== authorLoginId
      ) || beginnerUser;
      expandedComments.push(await prisma.comment.create({
        data: {
          postId: post.id,
          userId: secondCommentAuthor.id,
          content: '검색과 정렬 테스트에도 도움이 되는 글입니다.',
          reported: false,
          createdAt: daysFromNow(-Math.max(1, 15 - index), 18, 5)
        }
      }));
    }
  }

  for (let index = 0; index < expandedPosts.length; index += 1) {
    const { post, authorLoginId } = expandedPosts[index];
    const reactionCount = 2 + (index % 4);
    const candidates = reactionUsers.filter((candidate) => candidate.loginId !== authorLoginId).slice(0, reactionCount);

    for (let reactionIndex = 0; reactionIndex < candidates.length; reactionIndex += 1) {
      await prisma.communityReaction.create({
        data: {
          postId: post.id,
          userId: candidates[reactionIndex].id,
          type: (index + reactionIndex) % 7 === 0 ? 'DISLIKE' : 'LIKE'
        }
      });
    }
  }

  for (let index = 0; index < expandedPosts.length; index += 1) {
    const { post, authorLoginId } = expandedPosts[index];
    const bookmarkUsers = reactionUsers.filter((candidate) => candidate.loginId !== authorLoginId).slice(0, 1 + (index % 3));

    for (const bookmarkUser of bookmarkUsers) {
      await prisma.communityBookmark.create({
        data: {
          postId: post.id,
          userId: bookmarkUser.id
        }
      });
    }
  }

  const commentReactionTargets = [answerComment, reportedComment, resourceThanksComment, ...expandedComments];

  for (let index = 0; index < commentReactionTargets.length; index += 1) {
    const comment = commentReactionTargets[index];
    const primaryUser = reactionUsers.find((candidate) => candidate.id !== comment.userId) || mainUser;

    await prisma.commentReaction.create({
      data: {
        commentId: comment.id,
        userId: primaryUser.id,
        type: index % 6 === 0 ? 'DISLIKE' : 'LIKE'
      }
    });

    if (index % 5 === 0) {
      const secondaryUser = reactionUsers.find((candidate) => candidate.id !== comment.userId && candidate.id !== primaryUser.id) || peerUser;
      await prisma.commentReaction.create({
        data: {
          commentId: comment.id,
          userId: secondaryUser.id,
          type: 'LIKE'
        }
      });
    }
  }

  await prisma.communityReaction.create({
    data: {
      postId: questionPost.id,
      userId: peerUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: proofPost.id,
      userId: mainUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: reportedPost.id,
      userId: mainUser.id,
      type: 'DISLIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: resourcePost.id,
      userId: mainUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: resourcePost.id,
      userId: accessUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: examPost.id,
      userId: peerUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: encouragementPost.id,
      userId: rewardUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: encouragementPost.id,
      userId: beginnerUser.id,
      type: 'LIKE'
    }
  });
  await prisma.communityReaction.create({
    data: {
      postId: reportedPost.id,
      userId: communityUser.id,
      type: 'DISLIKE'
    }
  });

  await prisma.communityBookmark.create({
    data: {
      postId: questionPost.id,
      userId: peerUser.id
    }
  });
  await prisma.communityBookmark.create({
    data: {
      postId: proofPost.id,
      userId: mainUser.id
    }
  });
  await prisma.communityBookmark.create({
    data: {
      postId: resourcePost.id,
      userId: accessUser.id
    }
  });
  await prisma.communityBookmark.create({
    data: {
      postId: examPost.id,
      userId: peerUser.id
    }
  });
  await prisma.communityBookmark.create({
    data: {
      postId: encouragementPost.id,
      userId: rewardUser.id
    }
  });
  await prisma.communityBookmark.create({
    data: {
      postId: questionPost.id,
      userId: beginnerUser.id
    }
  });

  await prisma.communityReport.create({
    data: {
      id: SEED_IDS.reports.pendingPost,
      reporterId: mainUser.id,
      targetType: 'POST',
      postId: reportedPost.id,
      reason: '관리자 신고 처리 대기 상태 확인용',
      status: 'PENDING'
    }
  });
  await prisma.communityReport.create({
    data: {
      id: SEED_IDS.reports.resolvedComment,
      reporterId: rewardUser.id,
      targetType: 'COMMENT',
      commentId: reportedComment.id,
      reason: '댓글 신고 해결 상태 확인용',
      status: 'RESOLVED',
      resolvedById: adminUser.id,
      resolvedAt: new Date(),
      resolutionNote: '개발용 seed 데이터 기준 해결 처리'
    }
  });
  await prisma.communityReport.create({
    data: {
      id: SEED_IDS.reports.dismissedPost,
      reporterId: peerUser.id,
      targetType: 'POST',
      postId: questionPost.id,
      reason: '신고 기각 상태 확인용',
      status: 'DISMISSED',
      resolvedById: adminUser.id,
      resolvedAt: new Date(),
      resolutionNote: '문제 없음으로 기각'
    }
  });
  await prisma.communityReport.create({
    data: {
      id: SEED_IDS.reports.pendingComment,
      reporterId: accessUser.id,
      targetType: 'COMMENT',
      commentId: resourceThanksComment.id,
      reason: '댓글 신고 대기 상태 확인용',
      status: 'PENDING'
    }
  });
  await prisma.communityReport.create({
    data: {
      id: SEED_IDS.reports.resolvedPost,
      reporterId: communityUser.id,
      targetType: 'POST',
      postId: reportedPost.id,
      reason: '게시글 신고 해결 상태 확인용',
      status: 'RESOLVED',
      resolvedById: adminUser.id,
      resolvedAt: new Date(),
      resolutionNote: '관리자 데모용 게시글 신고 해결'
    }
  });

  await prisma.adminAction.create({
    data: {
      adminId: adminUser.id,
      targetType: 'COMMENT',
      targetId: answerComment.id,
      actionType: 'DELETE_COMMENT',
      reason: '관리자 액션 목록 개발용 기록'
    }
  });
  await prisma.adminAction.create({
    data: {
      adminId: adminUser.id,
      targetType: 'POST',
      targetId: reportedPost.id,
      actionType: 'HIDE_POST',
      reason: '신고 게시글 숨김 처리 데모 기록'
    }
  });
}

async function seedChallenge(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  const challenge = await prisma.studyChallenge.create({
    data: {
      id: SEED_IDS.challenges.daily,
      creatorId: mainUser.id,
      title: '매일 1시간 집중 챌린지',
      description: '하루에 최소 60분 집중하여 공부하는 개발용 챌린지입니다.',
      goalMinutes: 60,
      startDate: daysFromNow(-7, 0, 0),
      endDate: daysFromNow(14, 23, 59),
      status: 'IN_PROGRESS'
    }
  });

  await prisma.challengeMember.createMany({
    data: [
      { challengeId: challenge.id, userId: mainUser.id, progressMinutes: 345 },
      { challengeId: challenge.id, userId: peerUser.id, progressMinutes: 220 },
      { challengeId: challenge.id, userId: rewardUser.id, progressMinutes: 130 },
      { challengeId: challenge.id, userId: beginnerUser.id, progressMinutes: 55 },
      { challengeId: challenge.id, userId: accessUser.id, progressMinutes: 28 }
    ]
  });

  const weekendChallenge = await prisma.studyChallenge.create({
    data: {
      id: SEED_IDS.challenges.weekend,
      creatorId: communityUser.id,
      title: '주말 아침 복습 챌린지',
      description: '토요일과 일요일 오전에 짧게 복습하고 인증하는 개발용 챌린지입니다.',
      goalMinutes: 30,
      startDate: daysFromNow(-3, 0, 0),
      endDate: daysFromNow(10, 23, 59),
      status: 'IN_PROGRESS'
    }
  });

  await prisma.challengeMember.createMany({
    data: [
      { challengeId: weekendChallenge.id, userId: communityUser.id, progressMinutes: 75 },
      { challengeId: weekendChallenge.id, userId: mainUser.id, progressMinutes: 45 },
      { challengeId: weekendChallenge.id, userId: peerUser.id, progressMinutes: 30 }
    ]
  });

  await prisma.ranking.createMany({
    data: [
      {
        userId: mainUser.id,
        challengeId: challenge.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        rank: 1,
        studyMinutes: 345
      },
      {
        userId: peerUser.id,
        challengeId: challenge.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        rank: 2,
        studyMinutes: 220
      },
      {
        userId: rewardUser.id,
        challengeId: challenge.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        rank: 3,
        studyMinutes: 130
      },
      {
        userId: beginnerUser.id,
        challengeId: challenge.id,
        periodStart: daysFromNow(-6, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        rank: 4,
        studyMinutes: 55
      },
      {
        userId: communityUser.id,
        challengeId: weekendChallenge.id,
        periodStart: daysFromNow(-2, 0, 0),
        periodEnd: daysFromNow(0, 23, 59),
        rank: 1,
        studyMinutes: 75
      }
    ]
  });
}

async function seedLearningAndAi(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const communityUser = usersByLoginId['community_user'];
  const questUser = usersByLoginId['quest_user'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  const architectureNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.architecture,
      userId: mainUser.id,
      title: '소프트웨어 아키텍처 계층 구조 요약',
      content: 'Controller는 요청/응답을 담당하고 Service는 비즈니스 로직, Repository는 Prisma 접근을 담당한다.',
      subject: '소프트웨어공학',
      tags: ['architecture', 'backend', 'review']
    }
  });

  const asyncNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.async,
      userId: mainUser.id,
      title: 'JavaScript 비동기 처리 정리',
      content: 'Promise와 async/await는 비동기 흐름을 더 읽기 쉽게 구성하기 위한 문법이다.',
      subject: '웹 개발',
      tags: ['javascript', 'frontend']
    }
  });

  const databaseNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.database,
      userId: mainUser.id,
      title: 'Prisma relation과 seed 순서 정리',
      content: '관계형 데이터는 부모 데이터를 먼저 만들고 FK를 참조하는 자식 데이터를 나중에 생성해야 한다.',
      subject: '데이터베이스',
      tags: ['prisma', 'seed', 'relation']
    }
  });

  const englishNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.english,
      userId: communityUser.id,
      title: '영어 발표 표현 짧은 문장',
      content: 'The main purpose of this feature is to help students keep a steady learning routine.',
      subject: '영어',
      tags: ['english', 'presentation']
    }
  });

  const mathNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.math,
      userId: accessUser.id,
      title: '분수 계산 복습',
      content: '분모가 다른 분수는 통분한 뒤 더하고, 약분할 수 있으면 마지막에 약분한다.',
      subject: '수학',
      tags: ['math', 'review', 'easy-term']
    }
  });

  const beginnerMathNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.beginnerMath,
      userId: beginnerUser.id,
      title: '분수 덧셈 첫 루틴 노트',
      content: '분모를 같게 만든 뒤 분자끼리 더한다. 오늘은 예제 두 개만 천천히 풀어본다.',
      subject: '수학',
      tags: ['math', 'beginner', 'routine']
    }
  });

  const pdfMockNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.pdfMock,
      userId: mainUser.id,
      title: 'PDF/OCR Mock 학습 자료 요약',
      content: '업로드된 PDF와 이미지 OCR 결과라고 가정한 데모 노트입니다. 실제 파일 업로드나 외부 OCR API 호출 없이 요약/퀴즈 흐름을 확인합니다.',
      subject: '서비스 데모',
      tags: ['pdf', 'ocr', 'mock']
    }
  });

  const audioBriefingNote = await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.audioBriefing,
      userId: questUser.id,
      title: '오늘의 오디오 브리핑 요약',
      content: '오늘은 협동 퀘스트 기여도 추가, 보스 레이드 진행률 확인, 커뮤니티 새 댓글 알림을 차례로 점검합니다.',
      subject: '학습 브리핑',
      tags: ['audio-briefing', 'browser-speech', 'demo']
    }
  });

  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.architecture,
      userId: mainUser.id,
      noteId: architectureNote.id,
      question: 'Controller와 Service를 분리하는 이유를 한 문단으로 설명해줘.',
      answer: 'Controller는 HTTP 요청과 응답을 담당하고, Service는 실제 비즈니스 판단을 담당하므로 분리하면 테스트와 유지보수가 쉬워집니다.',
      subject: '소프트웨어공학'
    }
  });

  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.async,
      userId: mainUser.id,
      noteId: asyncNote.id,
      question: 'async/await와 Promise의 관계를 쉽게 설명해줘.',
      answer: 'async/await는 Promise를 더 동기 코드처럼 읽히게 작성하는 문법입니다.',
      subject: '웹 개발'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.studyPlan,
      userId: mainUser.id,
      noteId: databaseNote.id,
      question: '시험까지 5일 남았을 때 seed와 migration 차이를 어떻게 복습하면 좋을까?',
      answer: '1일차에는 schema와 migration 흐름을 보고, 2일차에는 seed idempotency를 확인하고, 마지막에는 실제 데모 데이터 흐름을 점검하면 좋습니다.',
      subject: '데이터베이스'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.quizHelp,
      userId: communityUser.id,
      noteId: englishNote.id,
      question: '이 영어 문장을 발표용으로 더 자연스럽게 바꿔줘.',
      answer: 'This feature helps students build a consistent study routine in a simple and motivating way.',
      subject: '영어'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.voiceReview,
      userId: accessUser.id,
      noteId: mathNote.id,
      question: '분수 계산 설명을 쉬운 말로 다시 알려줘.',
      answer: '분모를 같은 숫자로 맞춘 다음 분자끼리 더하고, 마지막에 더 줄일 수 있으면 줄이면 됩니다.',
      subject: '수학'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.beginnerMath,
      userId: beginnerUser.id,
      noteId: beginnerMathNote.id,
      question: '분수 덧셈을 처음 복습하는 학생에게 오늘 할 일을 짧게 알려줘.',
      answer: '오늘은 예제 2개를 천천히 풀고, 틀린 부분 한 줄만 기록하면 충분합니다. 25분만 집중해 보세요.',
      subject: '수학'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.pdfSummary,
      userId: mainUser.id,
      noteId: pdfMockNote.id,
      question: 'PDF/OCR mock 노트를 기반으로 발표용 핵심 요약을 만들어줘.',
      answer: '이 데모는 실제 파일 업로드나 외부 OCR 호출 없이, 추출된 텍스트가 있다고 가정하고 요약과 퀴즈 생성 흐름을 확인하는 기능입니다.',
      subject: '서비스 데모'
    }
  });
  await prisma.aIQuestion.create({
    data: {
      id: SEED_IDS.aiQuestions.audioBriefing,
      userId: questUser.id,
      noteId: audioBriefingNote.id,
      question: '오늘의 오디오 브리핑을 20초 분량으로 읽어줄 문장으로 정리해줘.',
      answer: '오늘은 협동 퀘스트 진행률과 보스 레이드 상태를 확인하고, 커뮤니티 댓글 알림까지 점검합니다. 완료된 항목은 보상 수령 상태도 함께 확인하세요.',
      subject: '학습 브리핑'
    }
  });

  await prisma.wrongAnswerNote.create({
    data: {
      id: SEED_IDS.wrongAnswers[0],
      userId: mainUser.id,
      noteId: architectureNote.id,
      problem: 'Repository 계층의 주된 책임은 무엇인가?',
      userAnswer: '비즈니스 로직 처리',
      explanation: 'Repository는 DB 접근을 담당하고, 비즈니스 로직은 Service 계층이 담당한다.',
      weakType: '계층형 구조 구분'
    }
  });
  await prisma.wrongAnswerNote.create({
    data: {
      id: SEED_IDS.wrongAnswers[1],
      userId: mainUser.id,
      noteId: databaseNote.id,
      problem: 'seed script에서 운영 DB 실행을 막아야 하는 이유는?',
      userAnswer: '테스트가 느려지기 때문',
      explanation: 'seed는 demo 데이터를 대량 생성하거나 삭제할 수 있으므로 운영/공유 DB에서 실행하면 실제 데이터가 오염될 수 있다.',
      weakType: '운영 데이터 보호'
    }
  });
  await prisma.wrongAnswerNote.create({
    data: {
      id: SEED_IDS.wrongAnswers[2],
      userId: accessUser.id,
      noteId: mathNote.id,
      problem: '1/2 + 1/3의 계산 과정은?',
      userAnswer: '2/5',
      explanation: '분모를 6으로 맞추면 3/6 + 2/6 = 5/6이다.',
      weakType: '분수 통분'
    }
  });
  await prisma.wrongAnswerNote.create({
    data: {
      id: SEED_IDS.wrongAnswers[3],
      userId: beginnerUser.id,
      noteId: beginnerMathNote.id,
      problem: '2/3 + 1/6의 계산 결과는?',
      userAnswer: '3/9',
      explanation: '2/3은 4/6으로 바꿀 수 있으므로 4/6 + 1/6 = 5/6이다.',
      weakType: '분모 맞추기'
    }
  });

  const quiz = await prisma.quiz.create({
    data: {
      id: SEED_IDS.quizzes.architecture,
      userId: mainUser.id,
      noteId: architectureNote.id,
      title: '계층형 구조 복습 퀴즈',
      difficulty: 'MEDIUM'
    }
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        id: SEED_IDS.quizQuestions[0],
        quizId: quiz.id,
        question: 'Service 계층의 역할로 가장 적절한 것은?',
        choicesJson: ['요청 라우팅', '비즈니스 로직 처리', 'DB index 생성', 'CSS 스타일링'],
        answer: '비즈니스 로직 처리',
        explanation: 'Service는 핵심 정책과 비즈니스 로직을 처리한다.',
        orderNo: 1
      },
      {
        id: SEED_IDS.quizQuestions[1],
        quizId: quiz.id,
        question: 'Prisma 접근 로직을 모아두는 계층은?',
        choicesJson: ['Controller', 'Repository', 'View', 'Middleware'],
        answer: 'Repository',
        explanation: 'Repository는 DB 접근을 분리하는 계층이다.',
        orderNo: 2
      }
    ]
  });

  const algorithmQuiz = await prisma.quiz.create({
    data: {
      id: SEED_IDS.quizzes.algorithm,
      userId: mainUser.id,
      noteId: databaseNote.id,
      title: 'seed와 데이터 관계 복습 퀴즈',
      difficulty: 'EASY'
    }
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        id: SEED_IDS.quizQuestions[2],
        quizId: algorithmQuiz.id,
        question: '반복 실행해도 같은 결과를 기대할 수 있는 seed의 성질은?',
        choicesJson: ['idempotent', 'unstable', 'random-only', 'external-only'],
        answer: 'idempotent',
        explanation: 'idempotent한 seed는 반복 실행해도 중복 데이터가 무한히 쌓이지 않도록 만든다.',
        orderNo: 1
      },
      {
        id: SEED_IDS.quizQuestions[3],
        quizId: algorithmQuiz.id,
        question: '관계형 seed에서 먼저 만들어야 하는 데이터는?',
        choicesJson: ['FK를 참조하는 자식 데이터', '부모 데이터', '로그 파일', '외부 API 응답'],
        answer: '부모 데이터',
        explanation: '부모 데이터를 먼저 만든 뒤 자식 데이터가 FK로 참조하도록 해야 한다.',
        orderNo: 2
      },
      {
        id: SEED_IDS.quizQuestions[4],
        quizId: algorithmQuiz.id,
        question: '운영/공유 DB에 개발용 seed를 실행하면 안 되는 이유는?',
        choicesJson: ['데모 데이터가 실제 데이터와 섞일 수 있음', 'CSS가 깨짐', '프론트 빌드가 느려짐', '브라우저 캐시가 사라짐'],
        answer: '데모 데이터가 실제 데이터와 섞일 수 있음',
        explanation: '개발용 seed는 삭제와 생성이 포함될 수 있으므로 개인 로컬/개발 DB에서만 실행해야 한다.',
        orderNo: 3
      }
    ]
  });

  await prisma.aIRecommendation.create({
    data: {
      id: SEED_IDS.recommendations.review,
      userId: mainUser.id,
      basisJson: {
        weakTypes: ['계층형 구조 구분', '테스트 전략'],
        recentWrongAnswerCount: 1
      },
      recommendationJson: {
        title: '계층형 구조와 테스트 흐름 복습',
        actions: ['Controller-Service-Repository 책임을 표로 정리', '관련 테스트 케이스 2개 다시 읽기']
      }
    }
  });
  await prisma.aIRecommendation.create({
    data: {
      id: SEED_IDS.recommendations.routine,
      userId: communityUser.id,
      basisJson: {
        recentSubjects: ['영어', '발표'],
        communityActivity: '자료 공유와 댓글 참여가 활발함'
      },
      recommendationJson: {
        title: '짧은 영어 발표 문장 반복 루틴',
        actions: ['매일 5문장 소리 내어 읽기', '커뮤니티에 예문 1개 공유', '북마크한 자료를 저녁에 다시 보기']
      }
    }
  });
  await prisma.aIRecommendation.create({
    data: {
      id: SEED_IDS.recommendations.exam,
      userId: accessUser.id,
      basisJson: {
        accessibility: ['largeText', 'voiceOutput'],
        weakTypes: ['분수 통분']
      },
      recommendationJson: {
        title: '쉬운 설명 중심 복습',
        actions: ['큰 글씨 모드로 예제 3개 풀기', '음성 안내로 풀이 순서 듣기', '틀린 문제만 오답노트에 남기기']
      }
    }
  });
  await prisma.aIRecommendation.create({
    data: {
      id: SEED_IDS.recommendations.beginner,
      userId: beginnerUser.id,
      basisJson: {
        recentMinutes: [12, 18, 25],
        weakTypes: ['분모 맞추기'],
        profileType: '초보 루틴형'
      },
      recommendationJson: {
        title: '25분 루틴 유지',
        actions: ['분수 예제 2개만 풀기', '틀린 이유 한 줄 적기', '내일 같은 시간에 다시 시작하기']
      }
    }
  });
  await prisma.aIRecommendation.create({
    data: {
      id: SEED_IDS.recommendations.audioBriefing,
      userId: questUser.id,
      basisJson: {
        recentQuestProgress: ['협동 퀘스트 95%', '보스 레이드 거의 완료'],
        briefingSource: 'browser speech demo'
      },
      recommendationJson: {
        title: '오늘의 오디오 브리핑',
        actions: ['협동 퀘스트 보상 상태 확인', '보스 레이드 남은 HP 확인', '커뮤니티 새 댓글 알림 확인'],
        note: '외부 TTS API 없이 브라우저 음성 기능으로 읽어주는 데모'
      }
    }
  });
}

async function seedRewards(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  const firstFocusBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_FIRST_FOCUS',
      name: '첫 집중 씨앗',
      description: '첫 집중 세션을 완료한 사용자에게 지급되는 배지',
      iconUrl: '/assets/badges/sagak-first-focus.png',
      condition: '집중 세션 1회 이상'
    }
  });
  const taskFinisherBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_TASK_FINISHER',
      name: '과제 마무리 연필',
      description: '태스크 완료 습관을 만든 사용자에게 지급되는 배지',
      iconUrl: '/assets/badges/sagak-task-finisher.png',
      condition: '완료 태스크 3개 이상'
    }
  });
  const streakBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_STREAK_SPROUT',
      name: '연속 학습 새싹',
      description: '꾸준한 집중 학습을 이어가는 사용자에게 지급되는 성장형 배지',
      iconUrl: '/assets/badges/sagak-streak-sprout.png',
      condition: '총 집중 시간 300분 이상'
    }
  });
  const communityHelperBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_COMMUNITY_HELPER',
      name: '커뮤니티 도움잎',
      description: '질문 답변과 자료 공유로 함께 공부하는 분위기를 만든 사용자에게 지급되는 배지',
      iconUrl: '/assets/badges/sagak-community-helper.png',
      condition: '커뮤니티 댓글과 북마크 활동 참여'
    }
  });
  const routinePencilBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_ROUTINE_PENCIL',
      name: '루틴 연필',
      description: '일정과 태스크를 꾸준히 관리한 사용자에게 지급되는 배지',
      iconUrl: '/assets/badges/sagak-routine-pencil.png',
      condition: '완료 태스크 7개 이상'
    }
  });
  const quizLeafBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_QUIZ_LEAF',
      name: '퀴즈 새잎',
      description: '복습 퀴즈를 통해 약점을 점검한 사용자에게 지급되는 배지',
      iconUrl: '/assets/badges/sagak-quiz-leaf.png',
      condition: '복습 퀴즈 5문항 이상 풀이'
    }
  });

  const focusQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_FOCUS_120',
      title: '집중 120분 달성',
      description: '총 집중 시간이 120분 이상이면 수령할 수 있는 퀘스트',
      type: 'TOTAL_STUDY_MINUTES',
      targetValue: 120,
      rewardPoints: 120,
      badgeId: firstFocusBadge.id,
      isActive: true
    }
  });
  const taskQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_TASK_3',
      title: '태스크 3개 완료',
      description: '완료한 칸반 태스크가 3개 이상이면 수령할 수 있는 퀘스트',
      type: 'TASK_COMPLETION',
      targetValue: 3,
      rewardPoints: 80,
      badgeId: taskFinisherBadge.id,
      isActive: true
    }
  });
  const streakQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_FOCUS_300',
      title: '집중 300분 누적',
      description: '총 집중 시간이 300분 이상이면 수령할 수 있는 장기 퀘스트',
      type: 'TOTAL_STUDY_MINUTES',
      targetValue: 300,
      rewardPoints: 200,
      badgeId: streakBadge.id,
      isActive: true
    }
  });
  const focusLongQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_FOCUS_600',
      title: '집중 600분 누적',
      description: '총 집중 시간이 600분 이상이면 수령할 수 있는 장기 집중 퀘스트',
      type: 'TOTAL_STUDY_MINUTES',
      targetValue: 600,
      rewardPoints: 300,
      badgeId: streakBadge.id,
      isActive: true
    }
  });
  const routineQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_TASK_7',
      title: '루틴 태스크 7개 완료',
      description: '완료한 태스크가 7개 이상이면 수령할 수 있는 루틴 퀘스트',
      type: 'TASK_COMPLETION',
      targetValue: 7,
      rewardPoints: 160,
      badgeId: routinePencilBadge.id,
      isActive: true
    }
  });
  const reviewQuest = await prisma.rewardQuest.create({
    data: {
      code: 'QUEST_REVIEW_ROUTINE',
      title: '복습 루틴 3개 완료',
      description: '복습 관련 태스크를 3개 이상 완료하면 수령할 수 있는 퀘스트',
      type: 'TASK_COMPLETION',
      targetValue: 3,
      rewardPoints: 90,
      badgeId: quizLeafBadge.id,
      isActive: true
    }
  });

  const mainAccount = await prisma.rewardAccount.upsert({
    where: { userId: mainUser.id },
    update: { pointBalance: 360 },
    create: { userId: mainUser.id, pointBalance: 360 }
  });
  const peerAccount = await prisma.rewardAccount.upsert({
    where: { userId: peerUser.id },
    update: { pointBalance: 60 },
    create: { userId: peerUser.id, pointBalance: 60 }
  });
  const friendAccount = await prisma.rewardAccount.upsert({
    where: { userId: friendUser.id },
    update: { pointBalance: 95 },
    create: { userId: friendUser.id, pointBalance: 95 }
  });
  const communityAccount = await prisma.rewardAccount.upsert({
    where: { userId: communityUser.id },
    update: { pointBalance: 180 },
    create: { userId: communityUser.id, pointBalance: 180 }
  });
  const rewardAccount = await prisma.rewardAccount.upsert({
    where: { userId: rewardUser.id },
    update: { pointBalance: 120 },
    create: { userId: rewardUser.id, pointBalance: 120 }
  });
  const raidAccount = await prisma.rewardAccount.upsert({
    where: { userId: raidUser.id },
    update: { pointBalance: 210 },
    create: { userId: raidUser.id, pointBalance: 210 }
  });
  const questAccount = await prisma.rewardAccount.upsert({
    where: { userId: questUser.id },
    update: { pointBalance: 160 },
    create: { userId: questUser.id, pointBalance: 160 }
  });
  const teamAccount01 = await prisma.rewardAccount.upsert({
    where: { userId: teamUser01.id },
    update: { pointBalance: 140 },
    create: { userId: teamUser01.id, pointBalance: 140 }
  });
  const teamAccount02 = await prisma.rewardAccount.upsert({
    where: { userId: teamUser02.id },
    update: { pointBalance: 85 },
    create: { userId: teamUser02.id, pointBalance: 85 }
  });
  const teamAccount03 = await prisma.rewardAccount.upsert({
    where: { userId: teamUser03.id },
    update: { pointBalance: 45 },
    create: { userId: teamUser03.id, pointBalance: 45 }
  });
  const accessAccount = await prisma.rewardAccount.upsert({
    where: { userId: accessUser.id },
    update: { pointBalance: 25 },
    create: { userId: accessUser.id, pointBalance: 25 }
  });
  const beginnerAccount = await prisma.rewardAccount.upsert({
    where: { userId: beginnerUser.id },
    update: { pointBalance: 10 },
    create: { userId: beginnerUser.id, pointBalance: 10 }
  });

  await prisma.userBadge.create({
    data: {
      userId: mainUser.id,
      badgeId: firstFocusBadge.id,
      achievedAt: daysFromNow(-5, 18, 0)
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: rewardUser.id,
      badgeId: taskFinisherBadge.id,
      achievedAt: daysFromNow(-1, 18, 0)
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: communityUser.id,
      badgeId: communityHelperBadge.id,
      achievedAt: daysFromNow(-2, 19, 0)
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: mainUser.id,
      badgeId: routinePencilBadge.id,
      achievedAt: daysFromNow(-1, 22, 0)
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: raidUser.id,
      badgeId: streakBadge.id,
      achievedAt: daysFromNow(-1, 7, 30)
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: questUser.id,
      badgeId: quizLeafBadge.id,
      achievedAt: daysFromNow(-1, 20, 0)
    }
  });

  await prisma.userQuest.createMany({
    data: [
      {
        userId: mainUser.id,
        questId: focusQuest.id,
        progressValue: 345,
        status: 'CLAIMED',
        achievedAt: daysFromNow(-5, 18, 0),
        claimedAt: daysFromNow(-4, 20, 0)
      },
      {
        userId: mainUser.id,
        questId: taskQuest.id,
        progressValue: 2,
        status: 'IN_PROGRESS'
      },
      {
        userId: mainUser.id,
        questId: streakQuest.id,
        progressValue: 345,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(-1, 21, 0)
      },
      {
        userId: rewardUser.id,
        questId: focusQuest.id,
        progressValue: 130,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(-1, 22, 0)
      },
      {
        userId: mainUser.id,
        questId: focusLongQuest.id,
        progressValue: 685,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(0, 22, 30)
      },
      {
        userId: mainUser.id,
        questId: routineQuest.id,
        progressValue: 7,
        status: 'CLAIMED',
        achievedAt: daysFromNow(-1, 20, 0),
        claimedAt: daysFromNow(-1, 20, 10)
      },
      {
        userId: communityUser.id,
        questId: reviewQuest.id,
        progressValue: 2,
        status: 'IN_PROGRESS'
      },
      {
        userId: accessUser.id,
        questId: reviewQuest.id,
        progressValue: 3,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(0, 11, 0)
      },
      {
        userId: beginnerUser.id,
        questId: focusQuest.id,
        progressValue: 55,
        status: 'IN_PROGRESS'
      },
      {
        userId: beginnerUser.id,
        questId: taskQuest.id,
        progressValue: 1,
        status: 'IN_PROGRESS'
      },
      {
        userId: raidUser.id,
        questId: streakQuest.id,
        progressValue: 480,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(-1, 7, 30)
      },
      {
        userId: questUser.id,
        questId: reviewQuest.id,
        progressValue: 3,
        status: 'CLAIMED',
        achievedAt: daysFromNow(-1, 20, 0),
        claimedAt: daysFromNow(-1, 20, 10)
      },
      {
        userId: teamUser01.id,
        questId: taskQuest.id,
        progressValue: 3,
        status: 'ACHIEVED',
        achievedAt: daysFromNow(0, 19, 0)
      },
      {
        userId: teamUser02.id,
        questId: focusQuest.id,
        progressValue: 55,
        status: 'IN_PROGRESS'
      },
      {
        userId: teamUser03.id,
        questId: focusQuest.id,
        progressValue: 30,
        status: 'IN_PROGRESS'
      }
    ]
  });

  await prisma.pointTransaction.createMany({
    data: [
      {
        userId: mainUser.id,
        accountId: mainAccount.id,
        type: 'EARN',
        amount: 120,
        reason: '집중 120분 달성',
        sourceType: 'REWARD_QUEST',
        sourceId: focusQuest.id,
        createdAt: daysFromNow(-4, 20, 0)
      },
      {
        userId: mainUser.id,
        accountId: mainAccount.id,
        type: 'ADJUST',
        amount: 120,
        reason: '개발용 보상 대시보드 초기 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(-2, 20, 0)
      },
      {
        userId: rewardUser.id,
        accountId: rewardAccount.id,
        type: 'EARN',
        amount: 120,
        reason: '보상 데모 사용자 퀘스트 달성',
        sourceType: 'REWARD_QUEST',
        sourceId: focusQuest.id,
        createdAt: daysFromNow(-1, 22, 0)
      },
      {
        userId: mainUser.id,
        accountId: mainAccount.id,
        type: 'EARN',
        amount: 160,
        reason: '루틴 태스크 7개 완료',
        sourceType: 'REWARD_QUEST',
        sourceId: routineQuest.id,
        createdAt: daysFromNow(-1, 20, 10)
      },
      {
        userId: mainUser.id,
        accountId: mainAccount.id,
        type: 'SPEND',
        amount: 40,
        reason: '포인트 상점 데모용 차감 기록',
        sourceType: 'POINT_SHOP_DEMO',
        sourceId: null,
        createdAt: daysFromNow(0, 9, 0)
      },
      {
        userId: peerUser.id,
        accountId: peerAccount.id,
        type: 'ADJUST',
        amount: 60,
        reason: '스터디 참여 데모 포인트',
        sourceType: 'ADMIN_ADJUSTMENT_DEMO',
        sourceId: null,
        createdAt: daysFromNow(-3, 19, 0)
      },
      {
        userId: communityUser.id,
        accountId: communityAccount.id,
        type: 'EARN',
        amount: 180,
        reason: '커뮤니티 자료 공유 보상',
        sourceType: 'COMMUNITY_ACTIVITY_DEMO',
        sourceId: null,
        createdAt: daysFromNow(-2, 18, 0)
      },
      {
        userId: accessUser.id,
        accountId: accessAccount.id,
        type: 'ADJUST',
        amount: 25,
        reason: '접근성 복습 루틴 시작 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(0, 11, 0)
      },
      {
        userId: beginnerUser.id,
        accountId: beginnerAccount.id,
        type: 'ADJUST',
        amount: 10,
        reason: '첫 프로필 대시보드 확인용 시작 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(0, 17, 30)
      },
      {
        userId: friendUser.id,
        accountId: friendAccount.id,
        type: 'ADJUST',
        amount: 95,
        reason: '친구 상태 QA용 시작 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(0, 15, 30)
      },
      {
        userId: raidUser.id,
        accountId: raidAccount.id,
        type: 'EARN',
        amount: 210,
        reason: '보스 레이드 참여 데모 포인트',
        sourceType: 'BOSS_RAID_DEMO',
        sourceId: null,
        createdAt: daysFromNow(-1, 8, 0)
      },
      {
        userId: questUser.id,
        accountId: questAccount.id,
        type: 'EARN',
        amount: 160,
        reason: '협동 퀘스트 보상 데모 포인트',
        sourceType: 'COLLAB_QUEST_DEMO',
        sourceId: null,
        createdAt: daysFromNow(-1, 20, 10)
      },
      {
        userId: teamUser01.id,
        accountId: teamAccount01.id,
        type: 'ADJUST',
        amount: 140,
        reason: '팀 QA 리더 데모 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(0, 19, 0)
      },
      {
        userId: teamUser02.id,
        accountId: teamAccount02.id,
        type: 'ADJUST',
        amount: 85,
        reason: '협동 퀘스트 검수 데모 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(-2, 18, 0)
      },
      {
        userId: teamUser03.id,
        accountId: teamAccount03.id,
        type: 'ADJUST',
        amount: 45,
        reason: '발표 준비 데모 포인트',
        sourceType: 'SEED',
        sourceId: null,
        createdAt: daysFromNow(-1, 21, 0)
      }
    ]
  });
}

async function seedPointShop(prisma, usersByLoginId) {
  const shopItems = await prisma.shopItem.findMany({
    where: {
      code: {
        in: DEV_SHOP_ITEMS.map((item) => item.code)
      }
    }
  });
  const shopItemsByCode = Object.fromEntries(shopItems.map((item) => [item.code, item]));

  for (const purchaseSeed of DEV_SHOP_PURCHASES) {
    const user = usersByLoginId[purchaseSeed.loginId];

    if (!user) {
      continue;
    }

    const purchasedItems = purchaseSeed.itemCodes
      .map((code) => shopItemsByCode[code])
      .filter(Boolean);

    if (purchasedItems.length) {
      await prisma.userShopPurchase.createMany({
        data: purchasedItems.map((item) => ({
          userId: user.id,
          itemId: item.id
        })),
        skipDuplicates: true
      });
    }

    const equippedImage = shopItemsByCode[purchaseSeed.equipped?.profileImage];
    const equippedBackground = shopItemsByCode[purchaseSeed.equipped?.profileBackground];
    const equippedTitle = shopItemsByCode[purchaseSeed.equipped?.title];

    await prisma.userProfile.upsert({
      where: {
        userId: user.id
      },
      update: {
        profileImageUrl: equippedImage?.assetUrl || null,
        profileBackgroundUrl: equippedBackground?.assetUrl || null,
        titleText: equippedTitle?.name || null
      },
      create: {
        userId: user.id,
        profileImageUrl: equippedImage?.assetUrl || null,
        profileBackgroundUrl: equippedBackground?.assetUrl || null,
        titleText: equippedTitle?.name || null
      }
    });
  }
}

async function seedBossRaids(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const rewardUser = usersByLoginId['reward_user'];

  const bossBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_BOSS_DAWN_SLAYER',
      name: '보스 레이드 슬레이어',
      description: '스터디 보스를 함께 처치한 파티원에게 지급되는 한정 배지',
      iconUrl: '/assets/badges/sagak-boss-dawn-slayer.png',
      condition: 'BOSS_RAID_CLEAR'
    }
  });

  const dawnBossRaid = await prisma.bossRaid.create({
    data: {
      code: 'BOSS_DAWN_PENCIL',
      name: '새벽 연필 보스',
      description: '집중 시간과 완료 태스크를 모아 새벽 연필 보스의 HP를 깎는 협동 레이드',
      imageUrl: '/assets/raids/dawn-pencil-boss.png',
      maxHp: 360,
      focusMinuteDamage: 1,
      taskCompletionDamage: 15,
      baseRewardPoints: 50,
      bonusRewardPoolPoints: 120,
      badgeId: bossBadge.id,
      startsAt: daysFromNow(-2, 6, 0),
      endsAt: daysFromNow(5, 23, 0),
      isActive: true
    }
  });

  const midnightBossRaid = await prisma.bossRaid.create({
    data: {
      code: 'BOSS_MIDNIGHT_GUARDIAN',
      name: '심야 수호자',
      description: '주말 누적 학습량으로 공략하는 다음 단계의 협동 보스',
      imageUrl: '/assets/raids/midnight-guardian-boss.png',
      maxHp: 540,
      focusMinuteDamage: 1,
      taskCompletionDamage: 18,
      baseRewardPoints: 70,
      bonusRewardPoolPoints: 180,
      startsAt: daysFromNow(1, 6, 0),
      endsAt: daysFromNow(8, 23, 0),
      isActive: true
    }
  });

  const sampleParty = await prisma.bossRaidParty.create({
    data: {
      raidId: dawnBossRaid.id,
      ownerId: peerUser.id,
      name: '아침 집중팟',
      joinCode: 'DAWN01',
      status: 'OPEN',
      totalDamage: 180,
      remainingHp: 180,
      lastCalculatedAt: daysFromNow(0, 9, 0),
      members: {
        create: [
          { userId: peerUser.id, joinedAt: daysFromNow(-1, 7, 30) },
          { userId: rewardUser.id, joinedAt: daysFromNow(-1, 7, 45) }
        ]
      }
    }
  });

  await prisma.bossRaidContribution.createMany({
    data: [
      {
        partyId: sampleParty.id,
        userId: peerUser.id,
        focusMinutes: 90,
        completedTaskCount: 3,
        totalDamage: 135,
        lastContributedAt: daysFromNow(0, 9, 0)
      },
      {
        partyId: sampleParty.id,
        userId: rewardUser.id,
        focusMinutes: 30,
        completedTaskCount: 1,
        totalDamage: 45,
        lastContributedAt: daysFromNow(0, 9, 0)
      }
    ]
  });

  const almostClearedParty = await prisma.bossRaidParty.create({
    data: {
      raidId: midnightBossRaid.id,
      ownerId: raidUser.id,
      name: '심야 마감팟',
      joinCode: 'NIGHT9',
      status: 'OPEN',
      totalDamage: 486,
      remainingHp: 54,
      lastCalculatedAt: daysFromNow(0, 22, 0),
      members: {
        create: [
          { userId: raidUser.id, joinedAt: daysFromNow(0, 20, 0) },
          { userId: questUser.id, joinedAt: daysFromNow(0, 20, 10) },
          { userId: teamUser01.id, joinedAt: daysFromNow(0, 20, 20) }
        ]
      }
    }
  });

  const clearedParty = await prisma.bossRaidParty.create({
    data: {
      raidId: dawnBossRaid.id,
      ownerId: mainUser.id,
      name: '새벽 완료팟',
      joinCode: 'CLEAR1',
      status: 'CLEARED',
      totalDamage: 390,
      remainingHp: 0,
      lastCalculatedAt: daysFromNow(-1, 8, 30),
      clearedAt: daysFromNow(-1, 8, 30),
      members: {
        create: [
          { userId: mainUser.id, joinedAt: daysFromNow(-2, 7, 0) },
          { userId: questUser.id, joinedAt: daysFromNow(-2, 7, 5) },
          { userId: raidUser.id, joinedAt: daysFromNow(-2, 7, 10) }
        ]
      }
    }
  });

  await prisma.bossRaidContribution.createMany({
    data: [
      {
        partyId: almostClearedParty.id,
        userId: raidUser.id,
        focusMinutes: 180,
        completedTaskCount: 5,
        totalDamage: 270,
        lastContributedAt: daysFromNow(0, 22, 0)
      },
      {
        partyId: almostClearedParty.id,
        userId: questUser.id,
        focusMinutes: 96,
        completedTaskCount: 3,
        totalDamage: 150,
        lastContributedAt: daysFromNow(0, 22, 0)
      },
      {
        partyId: almostClearedParty.id,
        userId: teamUser01.id,
        focusMinutes: 30,
        completedTaskCount: 2,
        totalDamage: 66,
        lastContributedAt: daysFromNow(0, 21, 40)
      },
      {
        partyId: clearedParty.id,
        userId: mainUser.id,
        focusMinutes: 150,
        completedTaskCount: 4,
        totalDamage: 210,
        lastContributedAt: daysFromNow(-1, 8, 30)
      },
      {
        partyId: clearedParty.id,
        userId: questUser.id,
        focusMinutes: 90,
        completedTaskCount: 2,
        totalDamage: 120,
        lastContributedAt: daysFromNow(-1, 8, 10)
      },
      {
        partyId: clearedParty.id,
        userId: raidUser.id,
        focusMinutes: 45,
        completedTaskCount: 1,
        totalDamage: 60,
        lastContributedAt: daysFromNow(-1, 8, 20)
      }
    ]
  });

  await prisma.bossRaidRewardClaim.createMany({
    data: [
      {
        raidId: dawnBossRaid.id,
        partyId: clearedParty.id,
        userId: mainUser.id,
        baseRewardPoints: 50,
        bonusRewardPoints: 45,
        badgeGranted: true,
        claimedAt: daysFromNow(-1, 8, 45)
      },
      {
        raidId: dawnBossRaid.id,
        partyId: clearedParty.id,
        userId: questUser.id,
        baseRewardPoints: 50,
        bonusRewardPoints: 35,
        badgeGranted: false,
        claimedAt: daysFromNow(-1, 8, 50)
      }
    ]
  });

  await prisma.userBadge.create({
    data: {
      userId: mainUser.id,
      badgeId: bossBadge.id,
      achievedAt: daysFromNow(-1, 8, 45)
    }
  });

  const raidClaimAccounts = await prisma.rewardAccount.findMany({
    where: {
      userId: {
        in: [mainUser.id, questUser.id]
      }
    }
  });
  const raidAccountByUserId = Object.fromEntries(raidClaimAccounts.map((account) => [account.userId, account]));
  const mainRaidReward = 95;
  const questRaidReward = 85;

  await prisma.pointTransaction.createMany({
    data: [
      {
        userId: mainUser.id,
        accountId: raidAccountByUserId[mainUser.id].id,
        type: 'EARN',
        amount: mainRaidReward,
        reason: '새벽 완료팟 보스 레이드 보상',
        sourceType: 'BOSS_RAID',
        sourceId: dawnBossRaid.id,
        createdAt: daysFromNow(-1, 8, 45)
      },
      {
        userId: questUser.id,
        accountId: raidAccountByUserId[questUser.id].id,
        type: 'EARN',
        amount: questRaidReward,
        reason: '새벽 완료팟 보스 레이드 보상',
        sourceType: 'BOSS_RAID',
        sourceId: dawnBossRaid.id,
        createdAt: daysFromNow(-1, 8, 50)
      }
    ]
  });

  await prisma.rewardAccount.update({
    where: { userId: mainUser.id },
    data: { pointBalance: { increment: mainRaidReward } }
  });
  await prisma.rewardAccount.update({
    where: { userId: questUser.id },
    data: { pointBalance: { increment: questRaidReward } }
  });
}

async function seedCollaborativeQuests(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const teamUser02 = usersByLoginId['team_user_02'];
  const teamUser03 = usersByLoginId['team_user_03'];

  const activeQuest = await prisma.collaborativeQuest.create({
    data: {
      id: SEED_IDS.collaborativeQuests.active,
      title: '발표 전 기능 점검 협동 퀘스트',
      description: '팀원이 각자 핵심 화면을 눌러보고 발견한 이슈를 기록하는 진행 중 퀘스트',
      goalValue: 200,
      currentValue: 65,
      status: 'ACTIVE',
      rewardPoints: 120,
      createdById: questUser.id,
      startsAt: daysFromNow(-1, 9, 0),
      endsAt: daysFromNow(5, 23, 0)
    }
  });

  const nearlyDoneQuest = await prisma.collaborativeQuest.create({
    data: {
      id: SEED_IDS.collaborativeQuests.nearlyDone,
      title: 'WebSocket smoke test 협동 퀘스트',
      description: '커뮤니티 댓글, 친구 presence, 레이드, 협동 퀘스트 실시간 이벤트를 함께 확인',
      goalValue: 100,
      currentValue: 95,
      status: 'ACTIVE',
      rewardPoints: 90,
      createdById: raidUser.id,
      startsAt: daysFromNow(-2, 10, 0),
      endsAt: daysFromNow(2, 23, 0)
    }
  });

  const completedQuest = await prisma.collaborativeQuest.create({
    data: {
      id: SEED_IDS.collaborativeQuests.completed,
      title: '커뮤니티 회귀 QA 완료 퀘스트',
      description: '게시글 검색/정렬/표보기/카드보기/댓글 알림 흐름을 완료한 퀘스트',
      goalValue: 120,
      currentValue: 120,
      status: 'COMPLETED',
      rewardPoints: 150,
      createdById: mainUser.id,
      startsAt: daysFromNow(-7, 9, 0),
      endsAt: daysFromNow(1, 23, 0),
      completedAt: daysFromNow(-1, 18, 30)
    }
  });

  const expiredQuest = await prisma.collaborativeQuest.create({
    data: {
      id: SEED_IDS.collaborativeQuests.expired,
      title: '지난 주말 짧은 복습 퀘스트',
      description: '만료 상태와 참여자 기여도 표시를 확인하기 위한 과거 퀘스트',
      goalValue: 80,
      currentValue: 20,
      status: 'EXPIRED',
      rewardPoints: 40,
      createdById: friendUser.id,
      startsAt: daysFromNow(-10, 9, 0),
      endsAt: daysFromNow(-3, 23, 0)
    }
  });

  await prisma.collaborativeQuestParticipant.createMany({
    data: [
      { questId: activeQuest.id, userId: questUser.id, contributionValue: 35, joinedAt: daysFromNow(-1, 9, 5) },
      { questId: activeQuest.id, userId: teamUser01.id, contributionValue: 20, joinedAt: daysFromNow(-1, 10, 0) },
      { questId: activeQuest.id, userId: friendUser.id, contributionValue: 10, joinedAt: daysFromNow(0, 14, 0) },
      { questId: nearlyDoneQuest.id, userId: raidUser.id, contributionValue: 55, joinedAt: daysFromNow(-2, 10, 5) },
      { questId: nearlyDoneQuest.id, userId: teamUser02.id, contributionValue: 40, joinedAt: daysFromNow(-1, 18, 0) },
      { questId: completedQuest.id, userId: mainUser.id, contributionValue: 60, joinedAt: daysFromNow(-7, 9, 10) },
      { questId: completedQuest.id, userId: communityUser.id, contributionValue: 35, joinedAt: daysFromNow(-6, 12, 0) },
      { questId: completedQuest.id, userId: questUser.id, contributionValue: 25, joinedAt: daysFromNow(-5, 20, 0) },
      { questId: expiredQuest.id, userId: friendUser.id, contributionValue: 12, joinedAt: daysFromNow(-10, 9, 30) },
      { questId: expiredQuest.id, userId: teamUser03.id, contributionValue: 8, joinedAt: daysFromNow(-9, 18, 0) }
    ]
  });

  await prisma.collaborativeQuestContribution.createMany({
    data: [
      { questId: activeQuest.id, userId: questUser.id, amount: 20, memo: '협동 퀘스트 화면 목록 QA', createdAt: daysFromNow(-1, 20, 0) },
      { questId: activeQuest.id, userId: questUser.id, amount: 15, memo: '기여도 추가 후 progress bar 확인', createdAt: daysFromNow(0, 9, 30) },
      { questId: activeQuest.id, userId: teamUser01.id, amount: 20, memo: '모바일 카드 상태 확인', createdAt: daysFromNow(0, 13, 0) },
      { questId: activeQuest.id, userId: friendUser.id, amount: 10, memo: '친구 계정으로 참여 상태 확인', createdAt: daysFromNow(0, 15, 0) },
      { questId: nearlyDoneQuest.id, userId: raidUser.id, amount: 55, memo: '보스 레이드 progress event와 함께 확인', createdAt: daysFromNow(-1, 8, 0) },
      { questId: nearlyDoneQuest.id, userId: teamUser02.id, amount: 40, memo: 'WebSocket reconnect 후 화면 갱신 확인', createdAt: daysFromNow(0, 18, 0) },
      { questId: completedQuest.id, userId: mainUser.id, amount: 60, memo: '커뮤니티 목록/상세 회귀 QA', createdAt: daysFromNow(-2, 18, 0) },
      { questId: completedQuest.id, userId: communityUser.id, amount: 35, memo: '댓글/대댓글 알림 확인', createdAt: daysFromNow(-2, 19, 0) },
      { questId: completedQuest.id, userId: questUser.id, amount: 25, memo: '보상 claim 버튼 상태 확인', createdAt: daysFromNow(-1, 18, 20) },
      { questId: expiredQuest.id, userId: friendUser.id, amount: 12, memo: '만료 퀘스트 참여 기록', createdAt: daysFromNow(-8, 11, 0) },
      { questId: expiredQuest.id, userId: teamUser03.id, amount: 8, memo: '만료 퀘스트 기여도 표시 확인', createdAt: daysFromNow(-7, 21, 0) }
    ]
  });

  const mainClaim = await prisma.collaborativeQuestRewardClaim.create({
    data: {
      questId: completedQuest.id,
      userId: mainUser.id,
      rewardPoints: completedQuest.rewardPoints,
      claimedAt: daysFromNow(-1, 18, 45)
    }
  });

  const communityClaim = await prisma.collaborativeQuestRewardClaim.create({
    data: {
      questId: completedQuest.id,
      userId: communityUser.id,
      rewardPoints: completedQuest.rewardPoints,
      claimedAt: daysFromNow(-1, 19, 0)
    }
  });

  const claimAccounts = await prisma.rewardAccount.findMany({
    where: {
      userId: {
        in: [mainUser.id, communityUser.id]
      }
    }
  });
  const accountByUserId = Object.fromEntries(claimAccounts.map((account) => [account.userId, account]));

  await prisma.pointTransaction.createMany({
    data: [
      {
        userId: mainUser.id,
        accountId: accountByUserId[mainUser.id].id,
        type: 'EARN',
        amount: mainClaim.rewardPoints,
        reason: '커뮤니티 회귀 QA 완료 퀘스트 보상',
        sourceType: 'COLLABORATIVE_QUEST',
        sourceId: completedQuest.id,
        createdAt: mainClaim.claimedAt
      },
      {
        userId: communityUser.id,
        accountId: accountByUserId[communityUser.id].id,
        type: 'EARN',
        amount: communityClaim.rewardPoints,
        reason: '커뮤니티 회귀 QA 완료 퀘스트 보상',
        sourceType: 'COLLABORATIVE_QUEST',
        sourceId: completedQuest.id,
        createdAt: communityClaim.claimedAt
      }
    ]
  });

  await prisma.rewardAccount.update({
    where: { userId: mainUser.id },
    data: { pointBalance: { increment: mainClaim.rewardPoints } }
  });
  await prisma.rewardAccount.update({
    where: { userId: communityUser.id },
    data: { pointBalance: { increment: communityClaim.rewardPoints } }
  });
}

async function seedSystemSettings(prisma) {
  await prisma.maintenanceSetting.upsert({
    where: {
      id: 1
    },
    update: {
      enabled: false,
      title: '사각사각 업데이트 중',
      message: '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.',
      estimatedEndAt: null
    },
    create: {
      id: 1,
      enabled: false,
      title: '사각사각 업데이트 중',
      message: '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.',
      estimatedEndAt: null
    }
  });
}

async function seedAccessibility(prisma, usersByLoginId) {
  const mainUser = usersByLoginId['dev_user'];
  const peerUser = usersByLoginId['study_peer'];
  const friendUser = usersByLoginId['friend_user'];
  const communityUser = usersByLoginId['community_user'];
  const rewardUser = usersByLoginId['reward_user'];
  const raidUser = usersByLoginId['raid_user'];
  const questUser = usersByLoginId['quest_user'];
  const teamUser01 = usersByLoginId['team_user_01'];
  const accessUser = usersByLoginId['accessibility_user'];
  const beginnerUser = usersByLoginId['beginner_user'];

  await prisma.accessibilityPreference.create({
    data: {
      userId: mainUser.id,
      textScale: 1.2,
      highContrast: false,
      elementaryFriendlyUi: true,
      voiceInputEnabled: true,
      voiceOutputEnabled: true,
      reviewReminderEnabled: true,
      reminderTime: '20:30'
    }
  });

  await prisma.accessibilityPreference.create({
    data: {
      userId: peerUser.id,
      textScale: 1,
      highContrast: true,
      elementaryFriendlyUi: false,
      voiceInputEnabled: false,
      voiceOutputEnabled: true,
      reviewReminderEnabled: false,
      reminderTime: null
    }
  });
  await prisma.accessibilityPreference.create({
    data: {
      userId: communityUser.id,
      textScale: 1.05,
      highContrast: false,
      elementaryFriendlyUi: false,
      voiceInputEnabled: true,
      voiceOutputEnabled: false,
      reviewReminderEnabled: true,
      reminderTime: '08:10'
    }
  });
  await prisma.accessibilityPreference.create({
    data: {
      userId: rewardUser.id,
      textScale: 1,
      highContrast: false,
      elementaryFriendlyUi: true,
      voiceInputEnabled: false,
      voiceOutputEnabled: true,
      reviewReminderEnabled: true,
      reminderTime: '21:00'
    }
  });
  await prisma.accessibilityPreference.create({
    data: {
      userId: accessUser.id,
      textScale: 1.35,
      highContrast: true,
      elementaryFriendlyUi: true,
      voiceInputEnabled: true,
      voiceOutputEnabled: true,
      reviewReminderEnabled: true,
      reminderTime: '10:30'
    }
  });
  await prisma.accessibilityPreference.create({
    data: {
      userId: beginnerUser.id,
      textScale: 1.15,
      highContrast: false,
      elementaryFriendlyUi: true,
      voiceInputEnabled: false,
      voiceOutputEnabled: false,
      reviewReminderEnabled: true,
      reminderTime: '17:30'
    }
  });
  await prisma.accessibilityPreference.createMany({
    data: [
      {
        userId: friendUser.id,
        textScale: 1,
        highContrast: false,
        elementaryFriendlyUi: false,
        voiceInputEnabled: false,
        voiceOutputEnabled: false,
        reviewReminderEnabled: true,
        reminderTime: '15:30'
      },
      {
        userId: raidUser.id,
        textScale: 1.1,
        highContrast: false,
        elementaryFriendlyUi: false,
        voiceInputEnabled: false,
        voiceOutputEnabled: true,
        reviewReminderEnabled: true,
        reminderTime: '07:30'
      },
      {
        userId: questUser.id,
        textScale: 1.05,
        highContrast: false,
        elementaryFriendlyUi: true,
        voiceInputEnabled: true,
        voiceOutputEnabled: true,
        reviewReminderEnabled: true,
        reminderTime: '20:00'
      },
      {
        userId: teamUser01.id,
        textScale: 1,
        highContrast: true,
        elementaryFriendlyUi: false,
        voiceInputEnabled: false,
        voiceOutputEnabled: false,
        reviewReminderEnabled: false,
        reminderTime: null
      }
    ]
  });

  await prisma.voiceAccessibilityRequest.createMany({
    data: [
      {
        userId: mainUser.id,
        mode: 'TTS',
        voiceType: 'ADULT_FEMALE',
        inputText: '오늘의 복습 알림을 차분한 음성 톤으로 확인합니다.'
      },
      {
        userId: mainUser.id,
        mode: 'STT',
        transcript: '내일 발표 리허설 일정을 추가해줘'
      },
      {
        userId: communityUser.id,
        mode: 'STT',
        transcript: '영어 단어 자료 공유 게시글 초안을 저장해줘'
      },
      {
        userId: rewardUser.id,
        mode: 'TTS',
        voiceType: 'BRIGHT',
        inputText: '수령 가능한 퀘스트가 있습니다. 보상 대시보드에서 확인해 보세요.'
      },
      {
        userId: accessUser.id,
        mode: 'TTS',
        voiceType: 'CALM',
        inputText: '분모를 먼저 맞춘 다음 분자끼리 더하면 됩니다.'
      },
      {
        userId: accessUser.id,
        mode: 'STT',
        transcript: '복습 알림을 오늘 저녁 여덟 시 반으로 설정해줘'
      },
      {
        userId: beginnerUser.id,
        mode: 'TTS',
        voiceType: 'CALM',
        inputText: '오늘은 25분 루틴을 한 번만 시도해 보세요.'
      },
      {
        userId: questUser.id,
        mode: 'TTS',
        voiceType: 'BRIGHT',
        inputText: '협동 퀘스트 진행률이 거의 완료되었습니다. 보상 수령 상태를 확인해 보세요.'
      },
      {
        userId: raidUser.id,
        mode: 'STT',
        transcript: '보스 레이드 진행률을 다시 확인해줘'
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: mainUser.id,
        type: 'REVIEW',
        message: '복습 알림 - 오늘 학습한 계층형 구조를 10분만 다시 확인해 보세요.',
        scheduledAt: daysFromNow(0, 20, 30)
      },
      {
        userId: mainUser.id,
        type: 'DEADLINE',
        message: '마감 임박 - 발표 데모 순서 체크리스트를 오늘 안에 정리해 보세요.',
        scheduledAt: daysFromNow(0, 18, 0)
      },
      {
        userId: communityUser.id,
        type: 'REVIEW',
        message: '아침 복습 - 어제 공유한 영어 예문 5개를 다시 읽어 보세요.',
        scheduledAt: daysFromNow(1, 8, 10)
      },
      {
        userId: rewardUser.id,
        type: 'CHALLENGE',
        message: '챌린지 알림 - 집중 120분 퀘스트 보상을 수령할 수 있습니다.',
        scheduledAt: daysFromNow(0, 21, 0)
      },
      {
        userId: accessUser.id,
        type: 'REVIEW',
        message: '복습 알림 - 분수 계산 예제를 천천히 다시 들어보세요.',
        scheduledAt: daysFromNow(-1, 10, 30),
        readAt: daysFromNow(0, 9, 0)
      },
      {
        userId: beginnerUser.id,
        type: 'REVIEW',
        message: '복습 알림 - 오늘의 작은 목표를 하나만 완료해 보세요.',
        scheduledAt: daysFromNow(0, 17, 30)
      },
      {
        userId: raidUser.id,
        type: 'CHALLENGE',
        message: '레이드 알림 - 심야 마감팟의 남은 HP가 얼마 남지 않았습니다.',
        scheduledAt: daysFromNow(0, 22, 15)
      },
      {
        userId: questUser.id,
        type: 'CHALLENGE',
        message: '협동 퀘스트 알림 - 완료된 퀘스트의 보상 수령 상태를 확인해 보세요.',
        scheduledAt: daysFromNow(0, 20, 10)
      },
      {
        userId: friendUser.id,
        type: 'REVIEW',
        message: '친구 학습 알림 - 친구 목록과 협동 학습 상태를 한 번 확인해 보세요.',
        scheduledAt: daysFromNow(0, 15, 45)
      }
    ]
  });
}

async function seedDevelopmentData(prisma) {
  const passwordHash = await hashPassword(DEV_SEED_PASSWORD);
  const users = [];

  for (const seedUser of DEV_SEED_USERS) {
    users.push(await upsertSeedUser(prisma, seedUser, passwordHash));
  }

  const usersByLoginId = Object.fromEntries(users.map((user) => [user.loginId, user]));
  for (const item of DEV_SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: {
        code: item.code
      },
      update: {
        name: item.name,
        description: item.description,
        type: item.type,
        price: item.price,
        assetUrl: item.assetUrl,
        isActive: true
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        type: item.type,
        price: item.price,
        assetUrl: item.assetUrl,
        isActive: true
      }
    });
  }

  await resetSeedData(prisma, users);
  await seedFriendships(prisma, usersByLoginId);
  const tasks = await seedSchedulesAndTasks(prisma, usersByLoginId);
  await seedFocusAndStatistics(prisma, usersByLoginId, tasks);
  await seedCommunity(prisma, usersByLoginId);
  await seedChallenge(prisma, usersByLoginId);
  await seedLearningAndAi(prisma, usersByLoginId);
  await seedRewards(prisma, usersByLoginId);
  await seedPointShop(prisma, usersByLoginId);
  await seedBossRaids(prisma, usersByLoginId);
  await seedCollaborativeQuests(prisma, usersByLoginId);
  await seedSystemSettings(prisma);
  await seedAccessibility(prisma, usersByLoginId);

  return users;
}

async function main() {
  assertSafeSeedEnvironment();

  const prisma = require('../src/utils/prisma');

  try {
    const users = await seedDevelopmentData(prisma);

    console.log('[seed:dev] Development seed completed');
    users.forEach((user) => {
      console.log(`[seed:dev] ${user.loginId} (${user.role})`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[seed:dev] ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  DEV_SEED_PASSWORD,
  DEV_SHOP_ITEMS,
  DEV_SHOP_PURCHASES,
  DEV_SEED_USERS,
  assertSafeSeedEnvironment,
  looksLikeProductionUrl,
  seedDevelopmentData,
  seedPointShop,
  seedBossRaids,
  upsertSeedUser
};
