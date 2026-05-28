const {
  DEV_SEED_PASSWORD,
  DEV_SHOP_ITEMS,
  DEV_SEED_USERS,
  assertSafeSeedEnvironment,
  looksLikeProductionUrl
} = require('../scripts/seed-dev');

describe('development seed script', () => {
  it('defines regular and admin development users only', () => {
    expect(DEV_SEED_USERS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'dev.user@example.com',
          role: 'USER',
          status: 'ACTIVE',
          profile: expect.objectContaining({
            learningGoal: expect.any(String),
            preferredSubject: expect.any(String)
          })
        }),
        expect.objectContaining({
          email: 'dev.admin@example.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          profile: expect.objectContaining({
            learningGoal: expect.any(String),
            preferredSubject: expect.any(String)
          })
        })
      ])
    );
    expect(DEV_SEED_PASSWORD).toEqual(expect.any(String));
  });

  it('defines default shop seed items for profile customization', () => {
    expect(DEV_SHOP_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PROFILE_AVATAR_SKY',
          type: 'PROFILE_IMAGE',
          price: expect.any(Number)
        }),
        expect.objectContaining({
          code: 'PROFILE_BACKGROUND_DAWN',
          type: 'PROFILE_BACKGROUND',
          price: expect.any(Number)
        }),
        expect.objectContaining({
          code: 'TITLE_EARLY_BIRD',
          type: 'TITLE',
          price: expect.any(Number)
        })
      ])
    );
  });

  it('requires database environment keys before running seed', () => {
    expect(() => assertSafeSeedEnvironment({})).toThrow('DATABASE_URL, DIRECT_URL');
  });

  it('rejects production environment mode', () => {
    expect(() =>
      assertSafeSeedEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'local-dev-database',
        DIRECT_URL: 'local-dev-direct'
      })
    ).toThrow('NODE_ENV is production');
  });

  it('rejects production-like database settings without printing secret values', () => {
    expect(looksLikeProductionUrl('team-production-database')).toBe(true);
    expect(looksLikeProductionUrl('team-dev-main-database')).toBe(false);

    expect(() =>
      assertSafeSeedEnvironment({
        DATABASE_URL: 'team-production-database',
        DIRECT_URL: 'team-dev-main-direct'
      })
    ).toThrow('DATABASE_URL');
  });

  it('allows non-production development environment keys', () => {
    expect(() =>
      assertSafeSeedEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'team-dev-main-database',
        DIRECT_URL: 'team-dev-main-direct'
      })
    ).not.toThrow();
  });
});
