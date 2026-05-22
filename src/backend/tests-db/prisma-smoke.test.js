const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

afterAll(async () => {
  if (global.prismaSmokeClient) {
    await global.prismaSmokeClient.$disconnect();
  }
});

describe('Prisma database smoke test', () => {
  test('runs a minimal SELECT 1 query', async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DB smoke test failed: DATABASE_URL is not configured');
    }

    const prisma = require('../src/utils/prisma');
    global.prismaSmokeClient = prisma;

    let result;

    try {
      result = await prisma.$queryRaw`SELECT 1::int AS value`;
    } catch (error) {
      throw new Error(`DB smoke test failed: ${error.code || error.name || 'query error'}`);
    }

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(Number(result[0].value)).toBe(1);
  });
});
