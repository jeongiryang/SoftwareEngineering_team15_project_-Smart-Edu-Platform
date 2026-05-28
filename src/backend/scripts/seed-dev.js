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
    reported: 900003
  },
  comments: {
    answer: 900011,
    proofReply: 900012,
    reported: 900013
  },
  reports: {
    pendingPost: 900021,
    resolvedComment: 900022,
    dismissedPost: 900023
  },
  challenge: 900031,
  notes: {
    architecture: 900041,
    async: 900042
  },
  aiQuestions: {
    architecture: 900051,
    async: 900052
  },
  wrongAnswer: 900061,
  quiz: 900071,
  quizQuestions: [900081, 900082],
  recommendations: {
    review: 900091
  }
};

const SEED_BADGE_CODES = [
  'SAGAK_FIRST_FOCUS',
  'SAGAK_TASK_FINISHER',
  'SAGAK_STREAK_SPROUT'
];

const SEED_QUEST_CODES = [
  'QUEST_FOCUS_120',
  'QUEST_TASK_3',
  'QUEST_FOCUS_300'
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
        { challengeId: SEED_IDS.challenge }
      ]
    }
  });
  await prisma.challengeMember.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { challengeId: SEED_IDS.challenge }
      ]
    }
  });
  await prisma.studyChallenge.deleteMany({
    where: {
      id: SEED_IDS.challenge
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
        { id: SEED_IDS.quiz },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.wrongAnswerNote.deleteMany({
    where: {
      OR: [
        { id: SEED_IDS.wrongAnswer },
        { userId: { in: userIds } }
      ]
    }
  });
  await prisma.aIRecommendation.deleteMany({
    where: {
      OR: [
        { id: SEED_IDS.recommendations.review },
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
  const rewardUser = usersByEmail['dev.reward@example.com'];

  const softwareReviewStart = daysFromNow(0, 19, 0);
  const algorithmStart = daysFromNow(1, 16, 30);
  const weeklyPlanStart = daysFromNow(3, 10, 0);

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

  return tasks;
}

async function seedFocusAndStatistics(prisma, usersByEmail, tasks) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
  const mainTask = tasks[0];
  const focusDurations = [50, 35, 70, 40, 65, 30, 55];

  for (let index = 0; index < focusDurations.length; index += 1) {
    const startedAt = daysFromNow(index - 6, 20, 0);
    await prisma.focusSession.create({
      data: {
        userId: mainUser.id,
        taskId: index % 2 === 0 ? mainTask.id : null,
        startedAt,
        endedAt: minutesAfter(startedAt, focusDurations[index]),
        durationMs: focusDurations[index] * 60 * 1000,
        memo: `${focusDurations[index]}분 집중 학습`
      }
    });
  }

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

  await prisma.studyStatistics.create({
    data: {
      userId: mainUser.id,
      periodStart: daysFromNow(-6, 0, 0),
      periodEnd: daysFromNow(0, 23, 59),
      totalMinutes: focusDurations.reduce((sum, minutes) => sum + minutes, 0),
      completionRate: 0.66,
      statisticsJson: {
        dailyMinutes: focusDurations,
        summary: '최근 7일 동안 꾸준히 집중 시간이 쌓이고 있음'
      }
    }
  });
}

async function seedCommunity(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];
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

  await prisma.adminAction.create({
    data: {
      adminId: adminUser.id,
      targetType: 'COMMENT',
      targetId: answerComment.id,
      actionType: 'DELETE_COMMENT',
      reason: '관리자 액션 목록 개발용 기록'
    }
  });
}

async function seedChallenge(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];

  const challenge = await prisma.studyChallenge.create({
    data: {
      id: SEED_IDS.challenge,
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
      { challengeId: challenge.id, userId: rewardUser.id, progressMinutes: 130 }
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
      }
    ]
  });
}

async function seedLearningAndAi(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];

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

  await prisma.studyNote.create({
    data: {
      id: SEED_IDS.notes.async,
      userId: mainUser.id,
      title: 'JavaScript 비동기 처리 정리',
      content: 'Promise와 async/await는 비동기 흐름을 더 읽기 쉽게 구성하기 위한 문법이다.',
      subject: '웹 개발',
      tags: ['javascript', 'frontend']
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
      question: 'async/await와 Promise의 관계를 쉽게 설명해줘.',
      answer: 'async/await는 Promise를 더 동기 코드처럼 읽히게 작성하는 문법입니다.',
      subject: '웹 개발'
    }
  });

  await prisma.wrongAnswerNote.create({
    data: {
      id: SEED_IDS.wrongAnswer,
      userId: mainUser.id,
      noteId: architectureNote.id,
      problem: 'Repository 계층의 주된 책임은 무엇인가?',
      userAnswer: '비즈니스 로직 처리',
      explanation: 'Repository는 DB 접근을 담당하고, 비즈니스 로직은 Service 계층이 담당한다.',
      weakType: '계층형 구조 구분'
    }
  });

  const quiz = await prisma.quiz.create({
    data: {
      id: SEED_IDS.quiz,
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
}

async function seedRewards(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const rewardUser = usersByEmail['dev.reward@example.com'];

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

  const mainAccount = await prisma.rewardAccount.upsert({
    where: { userId: mainUser.id },
    update: { pointBalance: 240 },
    create: { userId: mainUser.id, pointBalance: 240 }
  });
  const rewardAccount = await prisma.rewardAccount.upsert({
    where: { userId: rewardUser.id },
    update: { pointBalance: 120 },
    create: { userId: rewardUser.id, pointBalance: 120 }
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
      }
    ]
  });
}

async function seedAccessibility(prisma, usersByEmail) {
  const mainUser = usersByEmail['dev.user@example.com'];
  const peerUser = usersByEmail['dev.peer@example.com'];

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
      }
    ]
  });

  await prisma.notification.create({
    data: {
      userId: mainUser.id,
      type: 'REVIEW',
      message: '복습 알림 - 오늘 학습한 계층형 구조를 10분만 다시 확인해 보세요.',
      scheduledAt: daysFromNow(0, 20, 30)
    }
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
  const tasks = await seedSchedulesAndTasks(prisma, usersByEmail);
  await seedFocusAndStatistics(prisma, usersByEmail, tasks);
  await seedCommunity(prisma, usersByEmail);
  await seedChallenge(prisma, usersByEmail);
  await seedLearningAndAi(prisma, usersByEmail);
  await seedRewards(prisma, usersByEmail);
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
