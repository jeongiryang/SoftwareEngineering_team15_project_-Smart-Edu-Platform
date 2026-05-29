const prisma = require('../utils/prisma');

function findUserByLoginId(loginId) {
  return prisma.user.findUnique({
    where: { loginId }
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

function createUser({ loginId, name, passwordHash }) {
  return prisma.user.create({
    data: {
      loginId,
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

function updateUser(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data
  });
}

function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
}

module.exports = {
  createUser,
  findUserByLoginId,
  findUserById,
  findUserWithProfileById,
  updateUser,
  updateUserPassword,
  upsertUserProfile
};
