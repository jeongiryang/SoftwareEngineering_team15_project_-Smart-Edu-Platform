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
  DEV_SEED_USERS,
  assertSafeSeedEnvironment,
  looksLikeProductionUrl,
  seedDevelopmentData,
  upsertSeedUser
};
