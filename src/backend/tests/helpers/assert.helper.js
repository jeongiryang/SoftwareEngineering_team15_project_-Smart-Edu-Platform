function expectNoPasswordHash(payload) {
  expect(payload).not.toHaveProperty('passwordHash');
  expect(payload).not.toHaveProperty('password_hash');
}

function expectSafeUser(user) {
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      loginId: expect.any(String),
      name: expect.any(String),
      role: expect.any(String)
    })
  );
  expectNoPasswordHash(user);
}

module.exports = {
  expectNoPasswordHash,
  expectSafeUser
};
