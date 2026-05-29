const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { hashPassword } = require('../src/utils/password');

const DEV_SEED_PASSWORD = 'dev-password-1234';
const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'DIRECT_URL'];
const PRODUCTION_URL_PATTERNS = ['production', 'prod-', 'prod.'];

const DEV_SEED_USERS = [
  {
    email: 'dev.user@example.com',
    name: '개발용 일반 사용자',
    role: 'USER',
    status: 'ACTIVE',
    profile: {
      learningGoal: '개발 테스트 학습 목표',
      preferredSubject: '소프트웨어공학',
      profileImageUrl: null
    }
  },
  {
    email: 'dev.admin@example.com',
    name: '개발용 관리자',
    role: 'ADMIN',
    status: 'ACTIVE',
    profile: {
      learningGoal: '관리자 기능 테스트',
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

async function upsertSeedUser(prisma, seedUser, passwordHash) {
  return prisma.user.upsert({
    where: {
      email: seedUser.email
    },
    update: {
      name: seedUser.name,
      role: seedUser.role,
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
      status: seedUser.status,
      passwordHash,
      profile: {
        create: seedUser.profile
      }
    },
    select: {
      email: true,
      role: true
    }
  });
}

async function seedDevelopmentData(prisma) {
  const passwordHash = await hashPassword(DEV_SEED_PASSWORD);
  const users = [];

  for (const seedUser of DEV_SEED_USERS) {
    users.push(await upsertSeedUser(prisma, seedUser, passwordHash));
  }

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

  // Get the normal user to associate posts and challenges with
  const normalUser = await prisma.user.findUnique({
    where: { email: 'dev.user@example.com' }
  });

  if (normalUser) {
    await prisma.studyTask.deleteMany({ where: { userId: normalUser.id } });
    await prisma.studySchedule.deleteMany({ where: { userId: normalUser.id } });

    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 2);

    const studySchedule = await prisma.studySchedule.create({
      data: {
        userId: normalUser.id,
        title: 'Software engineering final review',
        subject: 'Software Engineering',
        startAt,
        endAt,
        priority: 'HIGH',
        memo: 'Review architecture, design patterns, and API structure'
      }
    });

    await prisma.studyTask.create({
      data: {
        userId: normalUser.id,
        scheduleId: studySchedule.id,
        title: 'Practice adapter pattern example',
        status: 'TODO',
        priority: 'MEDIUM',
        memo: 'Review Express router connection flow'
      }
    });

    await prisma.studyTask.create({
      data: {
        userId: normalUser.id,
        scheduleId: studySchedule.id,
        title: 'Summarize Prisma transaction guide',
        status: 'DONE',
        priority: 'HIGH',
        memo: 'Focus on atomicity and rollback behavior'
      }
    });

    // 1. Seed some posts (one reported, one normal)
    const post1 = await prisma.boardPost.upsert({
      where: { id: 991 },
      update: {
        title: '학습 질문 게시글입니다.',
        content: '소프트웨어공학 디자인 패턴에 대해 질문이 있습니다.',
        category: 'QUESTION',
        reported: false,
        userId: normalUser.id
      },
      create: {
        id: 991,
        title: '학습 질문 게시글입니다.',
        content: '소프트웨어공학 디자인 패턴에 대해 질문이 있습니다.',
        category: 'QUESTION',
        reported: false,
        userId: normalUser.id
      }
    });

    const post2 = await prisma.boardPost.upsert({
      where: { id: 992 },
      update: {
        title: '부적절한 광고성 게시글',
        content: '여기에 광고를 작성합니다. 신고해주세요.',
        category: 'FREE',
        reported: true,
        userId: normalUser.id
      },
      create: {
        id: 992,
        title: '부적절한 광고성 게시글',
        content: '여기에 광고를 작성합니다. 신고해주세요.',
        category: 'FREE',
        reported: true,
        userId: normalUser.id
      }
    });

    // 2. Seed some comments (one reported, one normal on post1)
    await prisma.comment.upsert({
      where: { id: 991 },
      update: {
        postId: post1.id,
        userId: normalUser.id,
        content: '좋은 질문이네요. 저도 궁금합니다.',
        reported: false
      },
      create: {
        id: 991,
        postId: post1.id,
        userId: normalUser.id,
        content: '좋은 질문이네요. 저도 궁금합니다.',
        reported: false
      }
    });

    await prisma.comment.upsert({
      where: { id: 992 },
      update: {
        postId: post1.id,
        userId: normalUser.id,
        content: '스팸/욕설이 섞인 부적절한 댓글입니다.',
        reported: true
      },
      create: {
        id: 992,
        postId: post1.id,
        userId: normalUser.id,
        content: '스팸/욕설이 섞인 부적절한 댓글입니다.',
        reported: true
      }
    });

    // 3. Seed a study challenge
    await prisma.studyChallenge.upsert({
      where: { id: 991 },
      update: {
        creatorId: normalUser.id,
        title: '매일 1시간 집중 챌린지',
        description: '하루에 최소 60분 집중하여 공부하는 챌린지입니다.',
        goalMinutes: 60,
        startDate: new Date('2026-05-01T00:00:00Z'),
        endDate: new Date('2026-06-01T00:00:00Z'),
        status: 'IN_PROGRESS'
      },
      create: {
        id: 991,
        creatorId: normalUser.id,
        title: '매일 1시간 집중 챌린지',
        description: '하루에 최소 60분 집중하여 공부하는 챌린지입니다.',
        goalMinutes: 60,
        startDate: new Date('2026-05-01T00:00:00Z'),
        endDate: new Date('2026-06-01T00:00:00Z'),
        status: 'IN_PROGRESS'
      }
    });

    await prisma.studyNote.upsert({
      where: { id: 991 },
      update: {
        userId: normalUser.id,
        title: '운영체제 핵심 요약',
        content: '프로세스와 스레드의 차이점은...',
        subject: 'CS',
        tags: ['OS', '면접준비']
      },
      create: {
        id: 991,
        userId: normalUser.id,
        title: '운영체제 핵심 요약',
        content: '프로세스와 스레드의 차이점은...',
        subject: 'CS',
        tags: ['OS', '면접준비']
      }
    });

    await prisma.studyNote.upsert({
      where: { id: 992 },
      update: {
        userId: normalUser.id,
        title: '자바스크립트 비동기 처리',
        content: 'Promise와 async/await의 동작 원리...',
        subject: '웹 개발',
        tags: ['JavaScript', 'Frontend']
      },
      create: {
        id: 992,
        userId: normalUser.id,
        title: '자바스크립트 비동기 처리',
        content: 'Promise와 async/await의 동작 원리...',
        subject: '웹 개발',
        tags: ['JavaScript', 'Frontend']
      }
    });
  }

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
  DEV_SHOP_ITEMS,
  DEV_SEED_USERS,
  assertSafeSeedEnvironment,
  looksLikeProductionUrl,
  seedDevelopmentData,
  upsertSeedUser
};
