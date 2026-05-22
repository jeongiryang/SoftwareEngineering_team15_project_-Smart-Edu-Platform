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

function findUserWithProfileById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true
    }
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

function upsertUserProfile(userId, data) {
  return prisma.userProfile.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data
    }
  });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUserWithProfileById,
  upsertUserProfile
};
