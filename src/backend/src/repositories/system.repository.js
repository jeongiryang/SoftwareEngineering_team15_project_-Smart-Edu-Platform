const prisma = require('../utils/prisma');

const MAINTENANCE_SETTING_ID = 1;

function findMaintenanceSetting() {
  return prisma.maintenanceSetting.findUnique({
    where: { id: MAINTENANCE_SETTING_ID }
  });
}

function upsertMaintenanceSetting(data) {
  return prisma.maintenanceSetting.upsert({
    where: { id: MAINTENANCE_SETTING_ID },
    create: {
      id: MAINTENANCE_SETTING_ID,
      ...data
    },
    update: data
  });
}

module.exports = {
  MAINTENANCE_SETTING_ID,
  findMaintenanceSetting,
  upsertMaintenanceSetting
};
