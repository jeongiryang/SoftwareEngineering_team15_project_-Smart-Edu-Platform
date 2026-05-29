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
    email: 'dev.user@example.com',
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
    email: 'dev.peer@example.com',
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
    email: 'dev.community@example.com',
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
    email: 'dev.reward@example.com',
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
    email: 'dev.access@example.com',
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
    email: 'dev.beginner@example.com',
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
    email: 'dev.admin@example.com',
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
    beginnerMath: 900046
  },
  aiQuestions: {
    architecture: 900051,
    async: 900052,
    studyPlan: 900053,
    quizHelp: 900054,
    voiceReview: 900055,
    beginnerMath: 900056
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
    beginner: 900094
  },
  friendships: {
    mainPeer: 900101,
    mainCommunity: 900102,
    mainRewardPending: 900103,
    accessMainPending: 900104,
    peerBeginnerRejected: 900105
  }
};

const SEED_BADGE_CODES = [
  'SAGAK_FIRST_FOCUS',
  'SAGAK_TASK_FINISHER',
  'SAGAK_STREAK_SPROUT',
  'SAGAK_COMMUNITY_HELPER',
  'SAGAK_ROUTINE_PENCIL',
  'SAGAK_QUIZ_LEAF',
  'SAGAK_BOSS_DAWN_SLAYER'
];

const SEED_QUEST_CODES = [
  'QUEST_FOCUS_120',
  'QUEST_TASK_3',
  'QUEST_FOCUS_300',
  'QUEST_FOCUS_600',
  'QUEST_TASK_7',
  'QUEST_REVIEW_ROUTINE'
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
      email: seedUser.email
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
      email: seedUser.email,
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
      email: true,
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

  await prisma.pointTransaction.deleteMany({
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
  await prisma.userQuest.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.userBadge.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });
  await prisma.rewardQuest.deleteMany({
    where: {
      code: { in: SEED_QUEST_CODES }
    }
  });
  await prisma.badge.deleteMany({
    where: {
      code: { in: SEED_BADGE_CODES }
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

async function seedSchedulesAndTasks(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

  const softwareReviewStart = daysFromNow(0, 19, 0);
  const algorithmStart = daysFromNow(1, 16, 30);
  const weeklyPlanStart = daysFromNow(3, 10, 0);
  const examPlanStart = daysFromNow(5, 9, 30);
  const pastReviewStart = daysFromNow(-2, 18, 0);
  const accessReviewStart = daysFromNow(0, 10, 0);
  const beginnerRoutineStart = daysFromNow(1, 17, 0);

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

  return tasks;
}

async function seedFriendships(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

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
      }
    ],
    skipDuplicates: true
  });
}

async function seedFocusAndStatistics(prisma, usersByEmail, tasks) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];
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
}

async function seedCommunity(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];
  const adminUser = usersByEmail['dev.admin@example.com'];

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

async function seedChallenge(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

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

async function seedLearningAndAi(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

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
}

async function seedRewards(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

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
      }
    ]
  });
}

async function seedBossRaids(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];

  const bossBadge = await prisma.badge.create({
    data: {
      code: 'SAGAK_BOSS_DAWN_SLAYER',
      name: '보스 레이드 클리어',
      description: '스터디 보스를 함께 처치한 파티원에게 지급되는 한정 배지',
      iconUrl: '/assets/badges/sagak-boss-dawn-slayer.png',
      condition: 'BOSS_RAID_CLEAR'
    }
  });

  const dawnBossRaid = await prisma.bossRaid.create({
    data: {
      code: 'BOSS_DAWN_PENCIL',
      name: '새벽 연필 보스',
      description: '집중 시간과 완료 태스크를 모아 연필 보스의 HP를 깎는 협동 레이드',
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

  await prisma.bossRaid.create({
    data: {
      code: 'BOSS_MIDNIGHT_GUARDIAN',
      name: '자정 수호자 보스',
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
      ownerId: mainUser.id,
      name: '아침 집중팟',
      joinCode: 'DAWN01',
      status: 'OPEN',
      totalDamage: 210,
      remainingHp: 150,
      lastCalculatedAt: daysFromNow(0, 9, 0),
      members: {
        create: [
          {
            userId: mainUser.id,
            joinedAt: daysFromNow(-1, 7, 30)
          },
          {
            userId: peerUser.id,
            joinedAt: daysFromNow(-1, 7, 45)
          },
          {
            userId: rewardUser.id,
            joinedAt: daysFromNow(-1, 8, 0)
          }
        ]
      }
    }
  });

  await prisma.bossRaidContribution.createMany({
    data: [
      {
        partyId: sampleParty.id,
        userId: mainUser.id,
        focusMinutes: 90,
        completedTaskCount: 3,
        totalDamage: 135,
        lastContributedAt: daysFromNow(0, 9, 0)
      },
      {
        partyId: sampleParty.id,
        userId: peerUser.id,
        focusMinutes: 30,
        completedTaskCount: 1,
        totalDamage: 45,
        lastContributedAt: daysFromNow(0, 9, 0)
      },
      {
        partyId: sampleParty.id,
        userId: rewardUser.id,
        focusMinutes: 15,
        completedTaskCount: 1,
        totalDamage: 30,
        lastContributedAt: daysFromNow(0, 9, 0)
      }
    ]
  });
}

async function seedAccessibility(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const communityUser = usersByEmail['dev.community@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const accessUser = usersByEmail['dev.access@example.com'];
  const beginnerUser = usersByEmail['dev.beginner@example.com'];

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

  const usersByEmail = Object.fromEntries(users.map((user) => [user.email, user]));

  await resetSeedData(prisma, users);
  await seedFriendships(prisma, usersByEmail);
  const tasks = await seedSchedulesAndTasks(prisma, usersByEmail);
  await seedFocusAndStatistics(prisma, usersByEmail, tasks);
  await seedCommunity(prisma, usersByEmail);
  await seedChallenge(prisma, usersByEmail);
  await seedLearningAndAi(prisma, usersByEmail);
  await seedRewards(prisma, usersByEmail);
  await seedBossRaids(prisma, usersByEmail);
  await seedAccessibility(prisma, usersByEmail);

  return users;
}

async function main() {
  assertSafeSeedEnvironment();

  const prisma = require('../src/utils/prisma');

  try {
    const users = await seedDevelopmentData(prisma);

    console.log('[seed:dev] Development seed completed');
    users.forEach((user) => {
      console.log(`[seed:dev] ${user.email} (${user.role})`);
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
  DEV_SEED_USERS,
  assertSafeSeedEnvironment,
  looksLikeProductionUrl,
  seedDevelopmentData,
  upsertSeedUser
};
