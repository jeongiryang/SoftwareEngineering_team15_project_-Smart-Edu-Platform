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

  // Seed study schedules and tasks for the development user
  const devUser = await prisma.user.findUnique({
    where: { email: 'dev.user@example.com' }
  });

  if (devUser) {
    // Clean up existing tasks and schedules for dev.user@example.com to avoid duplicates
    await prisma.studyTask.deleteMany({ where: { userId: devUser.id } });
    await prisma.studySchedule.deleteMany({ where: { userId: devUser.id } });

    // Create a new schedule
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + 1); // tomorrow
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 2);

    const schedule = await prisma.studySchedule.create({
      data: {
        userId: devUser.id,
        title: '소프트웨어공학 기말고사 준비',
        subject: '소프트웨어공학',
        startAt,
        endAt,
        priority: 'HIGH',
        memo: '디자인 패턴 및 아키텍처 학습'
      }
    });

    // Create tasks
    await prisma.studyTask.create({
      data: {
        userId: devUser.id,
        scheduleId: schedule.id,
        title: '어댑터 패턴 코드 예제 풀기',
        status: 'TODO',
        priority: 'MEDIUM',
        memo: 'Express 라우터 연결 부분 복습'
      }
    });

    await prisma.studyTask.create({
      data: {
        userId: devUser.id,
        scheduleId: schedule.id,
        title: 'Prisma 트랜잭션 공식 문서 요약',
        status: 'DONE',
        priority: 'HIGH',
        memo: '원자성 보장 파트 중심'
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
