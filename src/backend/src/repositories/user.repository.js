const prisma = require('../utils/prisma');

function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

function findUserById(id) {
  return prisma.user.findUnique({
    where: { id }
  });
}

function createUser({ email, name, passwordHash }) {
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      profile: {
        create: {}
      }
    }
  });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
