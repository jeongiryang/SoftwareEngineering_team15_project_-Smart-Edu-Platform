const bossRaidRepository = require('../repositories/bossRaid.repository');
const userRepository = require('../repositories/user.repository');
const {
  conflictError,
  notFoundError,
  validationError
} = require('../utils/errors');
const {
  normalizeString,
  parsePositiveInteger
} = require('../utils/validators');

const DAMAGE_CALCULATION_CACHE_MS = 5 * 60 * 1000;
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_JOIN_CODE_LENGTH = 6;

function parseBooleanFlag(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function sanitizeBadge(badge) {
  if (!badge) {
    return null;
  }

  return {
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    condition: badge.condition
  };
}

function sanitizeRaid(raid) {
  return {
    id: raid.id,
    code: raid.code,
    name: raid.name,
    description: raid.description,
    imageUrl: raid.imageUrl,
    maxHp: raid.maxHp,
    focusMinuteDamage: raid.focusMinuteDamage,
    taskCompletionDamage: raid.taskCompletionDamage,
    baseRewardPoints: raid.baseRewardPoints,
    bonusRewardPoolPoints: raid.bonusRewardPoolPoints,
    startsAt: raid.startsAt,
    endsAt: raid.endsAt,
    isActive: raid.isActive,
    badge: sanitizeBadge(raid.badge)
  };
}

function sanitizeContribution(contribution) {
  return {
    userId: contribution.userId,
    userName: contribution.user?.name,
    appearance: sanitizeAppearance(contribution.user),
    focusMinutes: contribution.focusMinutes,
    completedTaskCount: contribution.completedTaskCount,
    totalDamage: contribution.totalDamage,
    lastContributedAt: contribution.lastContributedAt
  };
}

function sanitizeAppearance(user) {
  return {
    profileImageUrl: user?.profile?.profileImageUrl || null,
    profileBackgroundUrl: user?.profile?.profileBackgroundUrl || null,
    titleText: user?.profile?.titleText || null
  };
}

function sanitizeUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    loginId: user.loginId,
    appearance: sanitizeAppearance(user)
  };
}

function sanitizeParty(party, currentUserId = null) {
  const activeMembers = (party.members || []).filter((member) => !member.leftAt);
  const activeMemberIds = new Set(activeMembers.map((member) => member.userId));
  const currentMember = currentUserId
    ? (party.members || []).find((member) => member.userId === currentUserId) || null
    : null;
  const currentUserArchived = Boolean(currentMember?.archivedAt);
  const currentUserHidden = Boolean(currentMember?.hiddenAt);
  const currentUserLeft = Boolean(currentMember?.leftAt);
  const remainingHp = Math.max(party.raid.maxHp - party.totalDamage, 0);
  const totalMembers = activeMembers.length;
  const currentContribution = currentUserId
    ? party.contributions.find((contribution) => contribution.userId === currentUserId) || null
    : null;
  const visibleContributions = (party.contributions || []).filter((contribution) => (
    activeMemberIds.has(contribution.userId) || contribution.userId === currentUserId
  ));

  return {
    id: party.id,
    name: party.name,
    joinCode: party.joinCode,
    isPublic: party.isPublic !== false,
    inviteMode: party.isPublic === false ? 'PRIVATE' : 'PUBLIC',
    status: party.status,
    totalDamage: party.totalDamage,
    remainingHp,
    clearedAt: party.clearedAt,
    lastCalculatedAt: party.lastCalculatedAt,
    raid: sanitizeRaid(party.raid),
    owner: party.owner,
    totalMembers,
    members: activeMembers.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      appearance: sanitizeAppearance(member.user),
      joinedAt: member.joinedAt,
      hiddenAt: member.hiddenAt || null,
      archivedAt: member.archivedAt || null,
      leftAt: member.leftAt || null
    })),
    contributions: visibleContributions.map(sanitizeContribution),
    currentUserContribution: currentContribution ? sanitizeContribution(currentContribution) : null,
    currentUserMembership: currentMember
      ? {
          hiddenAt: currentMember.hiddenAt || null,
          archivedAt: currentMember.archivedAt || null,
          leftAt: currentMember.leftAt || null,
          isActive: !currentMember.leftAt
        }
      : null,
    currentUserHidden,
    currentUserArchived,
    currentUserLeft,
    canArchive: Boolean(currentMember && !currentUserLeft && ['CLEARED', 'CLOSED'].includes(party.status)),
    canRestore: Boolean(currentMember && !currentUserLeft && (currentUserHidden || currentUserArchived)),
    canLeave: Boolean(
      currentMember
        && !currentUserLeft
        && party.status === 'OPEN'
        && !(party.ownerId === currentUserId && activeMembers.length > 1)
    )
  };
}

function sanitizeInvite(invite, currentUserId = null) {
  return {
    id: invite.id,
    partyId: invite.partyId,
    status: invite.status,
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
    respondedAt: invite.respondedAt || null,
    inviter: sanitizeUserSummary(invite.inviter),
    invitee: sanitizeUserSummary(invite.invitee),
    party: invite.party ? sanitizeParty(invite.party, currentUserId) : null
  };
}

function ensurePartyName(name) {
  const normalizedName = normalizeString(name);

  if (!normalizedName) {
    throw validationError('party name is required', { field: 'name' });
  }

  if (normalizedName.length > 40) {
    throw validationError('party name must be 40 characters or fewer', { field: 'name' });
  }

  return normalizedName;
}

function ensureJoinCode(joinCode) {
  const normalizedJoinCode = normalizeString(joinCode)?.toUpperCase();

  if (!normalizedJoinCode) {
    throw validationError('joinCode is required', { field: 'joinCode' });
  }

  return normalizedJoinCode;
}

function parsePartyVisibility(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, 'isPublic')) {
    return payload.isPublic !== false;
  }

  const normalizedVisibility = normalizeString(payload.visibility)?.toUpperCase();

  if (!normalizedVisibility) {
    return true;
  }

  if (normalizedVisibility === 'PUBLIC') {
    return true;
  }

  if (normalizedVisibility === 'PRIVATE') {
    return false;
  }

  throw validationError('visibility must be PUBLIC or PRIVATE', { field: 'visibility' });
}

function parseOptionalRaidId(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return parsePositiveInteger(value, 'raidId');
}

function buildJoinCode() {
  let code = '';

  for (let index = 0; index < DEFAULT_JOIN_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_ALPHABET.length);
    code += JOIN_CODE_ALPHABET[randomIndex];
  }

  return code;
}

async function createUniqueJoinCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = buildJoinCode();
    const existingParty = await bossRaidRepository.findBossRaidPartyByJoinCode(joinCode);

    if (!existingParty) {
      return joinCode;
    }
  }

  throw conflictError('Unable to generate a unique raid join code');
}

function ensureActiveRaid(raid) {
  if (!raid || !raid.isActive) {
    throw notFoundError('Boss raid not found');
  }

  if (raid.endsAt && raid.endsAt < new Date()) {
    throw conflictError('Boss raid is already closed');
  }
}

function ensurePartyIsJoinable(party) {
  if (party.status !== 'OPEN') {
    throw conflictError('Boss raid party is not open for new members');
  }

  if (party.raid.endsAt && party.raid.endsAt < new Date()) {
    throw conflictError('Boss raid is already closed');
  }
}

function ensureOwnerCanManageInvites(party, userId) {
  if (party.ownerId !== userId) {
    throw conflictError('Only the boss raid party owner can manage invites');
  }
}

function getCurrentMember(party, userId) {
  return (party.members || []).find((member) => member.userId === userId) || null;
}

function getActiveMembers(party) {
  return (party.members || []).filter((member) => !member.leftAt);
}

function ensureCurrentActiveMember(party, userId) {
  const currentMember = getCurrentMember(party, userId);

  if (!currentMember || currentMember.leftAt) {
    throw conflictError('You are not an active member of this boss raid party');
  }

  return currentMember;
}

function ensurePartyCanBeArchived(party) {
  if (!['CLEARED', 'CLOSED'].includes(party.status)) {
    throw conflictError('Only completed or closed boss raid parties can be archived');
  }
}

function calculateContributionDamage(raid, metrics) {
  const focusDamage = metrics.focusMinutes * raid.focusMinuteDamage;
  const taskDamage = metrics.completedTaskCount * raid.taskCompletionDamage;

  return {
    focusMinutes: metrics.focusMinutes,
    completedTaskCount: metrics.completedTaskCount,
    totalDamage: focusDamage + taskDamage,
    lastContributedAt: new Date()
  };
}

function shouldRecalculateParty(party) {
  if (!party.lastCalculatedAt) {
    return true;
  }

  if (party.status === 'CLEARED' || party.status === 'CLOSED') {
    return false;
  }

  return Date.now() - party.lastCalculatedAt.getTime() >= DAMAGE_CALCULATION_CACHE_MS;
}

async function recalculatePartyProgressIfNeeded(party) {
  if (!shouldRecalculateParty(party)) {
    return party;
  }

  const recalculatedContributions = [];
  const activeMembers = getActiveMembers(party);

  for (const member of activeMembers) {
    const effectiveStart = new Date(
      Math.max(member.joinedAt.getTime(), party.raid.startsAt.getTime())
    );
    const metrics = await bossRaidRepository.getBossRaidMemberMetrics(member.userId, effectiveStart);

    recalculatedContributions.push({
      userId: member.userId,
      ...calculateContributionDamage(party.raid, metrics)
    });
  }

  const recalculatedParty = await bossRaidRepository.replaceBossRaidContributions(
    party.id,
    recalculatedContributions,
    activeMembers.map((member) => member.userId)
  );
  const totalDamage = recalculatedContributions.reduce(
    (sum, contribution) => sum + contribution.totalDamage,
    0
  );
  const isCleared = totalDamage >= recalculatedParty.raid.maxHp;

  return bossRaidRepository.updateBossRaidPartyProgress(party.id, {
    totalDamage,
    remainingHp: Math.max(recalculatedParty.raid.maxHp - totalDamage, 0),
    status: isCleared ? 'CLEARED' : 'OPEN',
    clearedAt: isCleared ? recalculatedParty.clearedAt || new Date() : null,
    lastCalculatedAt: new Date()
  });
}

async function getBossRaids(userId) {
  const [raids, parties] = await Promise.all([
    bossRaidRepository.findActiveBossRaids(),
    bossRaidRepository.findUserBossRaidParties(userId)
  ]);
  const joinedRaidIds = new Set(parties.map((party) => party.raidId));

  return raids.map((raid) => ({
    ...sanitizeRaid(raid),
    hasJoinedParty: joinedRaidIds.has(raid.id)
  }));
}

async function createBossRaidParty(userId, payload) {
  const raidId = parsePositiveInteger(payload.raidId, 'raidId');
  const name = ensurePartyName(payload.name);
  const isPublic = parsePartyVisibility(payload);
  const raid = await bossRaidRepository.findBossRaidById(raidId);

  ensureActiveRaid(raid);

  const existingParty = await bossRaidRepository.findUserBossRaidPartyForRaid(userId, raidId);

  if (existingParty) {
    throw conflictError('You already joined a party for this boss raid');
  }

  const joinCode = await createUniqueJoinCode();
  const party = await bossRaidRepository.createBossRaidParty({
    raidId,
    ownerId: userId,
    name,
    joinCode,
    isPublic
  });

  const refreshedParty = await recalculatePartyProgressIfNeeded(party);

  return sanitizeParty(refreshedParty, userId);
}

async function getPublicBossRaidParties(userId, payload = {}) {
  const raidId = parseOptionalRaidId(payload.raidId);
  const parties = await bossRaidRepository.findPublicBossRaidParties(raidId);
  const refreshedParties = [];

  for (const party of parties) {
    refreshedParties.push(await recalculatePartyProgressIfNeeded(party));
  }

  return refreshedParties.map((party) => sanitizeParty(party, userId));
}

async function joinBossRaidParty(userId, payload) {
  const joinCode = ensureJoinCode(payload.joinCode);
  const party = await bossRaidRepository.findBossRaidPartyByJoinCode(joinCode);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensurePartyIsJoinable(party);

  const existingParty = await bossRaidRepository.findUserBossRaidPartyForRaid(userId, party.raidId);

  if (existingParty) {
    throw conflictError('You already joined a party for this boss raid');
  }

  const joinedParty = await bossRaidRepository.addBossRaidPartyMember(party.id, userId);
  const refreshedParty = await recalculatePartyProgressIfNeeded(joinedParty);

  return sanitizeParty(refreshedParty, userId);
}

async function joinPublicBossRaidParty(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party || party.isPublic === false) {
    throw notFoundError('Boss raid party not found');
  }

  ensurePartyIsJoinable(party);

  const existingParty = await bossRaidRepository.findUserBossRaidPartyForRaid(userId, party.raidId);

  if (existingParty) {
    throw conflictError('You already joined a party for this boss raid');
  }

  const joinedParty = await bossRaidRepository.addBossRaidPartyMember(party.id, userId);
  const refreshedParty = await recalculatePartyProgressIfNeeded(joinedParty);

  return sanitizeParty(refreshedParty, userId);
}

async function getMyBossRaidInvites(userId) {
  const invites = await bossRaidRepository.findBossRaidInvitesForUser(userId);

  return invites.map((invite) => sanitizeInvite(invite, userId));
}

async function getBossRaidPartyInvites(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensureOwnerCanManageInvites(party, userId);

  const invites = await bossRaidRepository.findBossRaidInvitesForParty(id);

  return invites.map((invite) => sanitizeInvite(invite, userId));
}

async function createBossRaidInvite(userId, partyId, payload = {}) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const loginId = normalizeString(payload.loginId);

  if (!loginId) {
    throw validationError('loginId is required', { field: 'loginId' });
  }

  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensureOwnerCanManageInvites(party, userId);
  ensurePartyIsJoinable(party);

  const invitee = await userRepository.findUserByLoginId(loginId);

  if (!invitee) {
    throw notFoundError('Invitee user not found');
  }

  if (invitee.id === userId) {
    throw conflictError('You cannot invite yourself to your own boss raid party');
  }

  const alreadyMember = party.members.some((member) => member.userId === invitee.id);

  if (alreadyMember) {
    throw conflictError('User already joined this boss raid party');
  }

  const existingParty = await bossRaidRepository.findUserBossRaidPartyForRaid(invitee.id, party.raidId);

  if (existingParty) {
    throw conflictError('User already joined a party for this boss raid');
  }

  const existingInvite = await bossRaidRepository.findBossRaidInviteForPartyAndUser(id, invitee.id);

  if (existingInvite?.status === 'PENDING') {
    throw conflictError('Boss raid invite is already pending for this user');
  }

  const invite = await bossRaidRepository.upsertBossRaidInvite({
    partyId: id,
    inviterId: userId,
    inviteeId: invitee.id
  });

  return sanitizeInvite(invite, userId);
}

async function acceptBossRaidInvite(userId, inviteId) {
  const id = parsePositiveInteger(inviteId, 'inviteId');
  const invite = await bossRaidRepository.findBossRaidInviteById(id);

  if (!invite || invite.inviteeId !== userId) {
    throw notFoundError('Boss raid invite not found');
  }

  if (invite.status !== 'PENDING') {
    throw conflictError('Boss raid invite is not pending');
  }

  ensurePartyIsJoinable(invite.party);

  const existingParty = await bossRaidRepository.findUserBossRaidPartyForRaid(userId, invite.party.raidId);

  if (existingParty) {
    throw conflictError('You already joined a party for this boss raid');
  }

  const acceptedParty = await bossRaidRepository.acceptBossRaidInvite({
    inviteId: id,
    partyId: invite.partyId,
    userId
  });
  const refreshedParty = await recalculatePartyProgressIfNeeded(acceptedParty);

  return sanitizeParty(refreshedParty, userId);
}

async function declineBossRaidInvite(userId, inviteId) {
  const id = parsePositiveInteger(inviteId, 'inviteId');
  const invite = await bossRaidRepository.findBossRaidInviteById(id);

  if (!invite || invite.inviteeId !== userId) {
    throw notFoundError('Boss raid invite not found');
  }

  if (invite.status !== 'PENDING') {
    throw conflictError('Boss raid invite is not pending');
  }

  const updatedInvite = await bossRaidRepository.updateBossRaidInviteStatus(id, 'DECLINED');

  return sanitizeInvite(updatedInvite, userId);
}

async function cancelBossRaidInvite(userId, inviteId) {
  const id = parsePositiveInteger(inviteId, 'inviteId');
  const invite = await bossRaidRepository.findBossRaidInviteById(id);

  if (!invite) {
    throw notFoundError('Boss raid invite not found');
  }

  ensureOwnerCanManageInvites(invite.party, userId);

  if (invite.status !== 'PENDING') {
    throw conflictError('Only pending boss raid invites can be cancelled');
  }

  const updatedInvite = await bossRaidRepository.updateBossRaidInviteStatus(id, 'CANCELLED');

  return sanitizeInvite(updatedInvite, userId);
}

async function getMyBossRaidParties(userId, options = {}) {
  const parties = await bossRaidRepository.findUserBossRaidParties(userId, {
    includeHidden: parseBooleanFlag(options.includeHidden)
  });
  const refreshedParties = [];

  for (const party of parties) {
    refreshedParties.push(await recalculatePartyProgressIfNeeded(party));
  }

  return refreshedParties.map((party) => sanitizeParty(party, userId));
}

async function getBossRaidPartyDetail(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensureCurrentActiveMember(party, userId);

  const refreshedParty = await recalculatePartyProgressIfNeeded(party);

  return sanitizeParty(refreshedParty, userId);
}

async function claimBossRaidReward(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensureCurrentActiveMember(party, userId);

  const refreshedParty = await recalculatePartyProgressIfNeeded(party);

  if (refreshedParty.status !== 'CLEARED') {
    throw conflictError('Boss raid is not cleared yet');
  }

  const existingClaim = await bossRaidRepository.findBossRaidRewardClaim(refreshedParty.raidId, userId);

  if (existingClaim) {
    throw conflictError('Boss raid reward already claimed');
  }

  const contribution = refreshedParty.contributions.find(
    (item) => item.userId === userId
  );

  if (!contribution) {
    throw conflictError('Boss raid contribution not found');
  }

  const totalDamage = Math.max(
    refreshedParty.contributions.reduce((sum, item) => sum + item.totalDamage, 0),
    1
  );
  const baseRewardPoints = refreshedParty.raid.baseRewardPoints;
  const bonusRewardPoints = Math.floor(
    refreshedParty.raid.bonusRewardPoolPoints * (contribution.totalDamage / totalDamage)
  );

  const result = await bossRaidRepository.claimBossRaidReward({
    userId,
    party: refreshedParty,
    contribution,
    baseRewardPoints,
    bonusRewardPoints
  });

  if (!result) {
    throw conflictError('Boss raid reward already claimed');
  }

  return {
    raid: sanitizeRaid(refreshedParty.raid),
    party: sanitizeParty(refreshedParty, userId),
    reward: {
      baseRewardPoints,
      bonusRewardPoints,
      totalRewardPoints: baseRewardPoints + bonusRewardPoints
    },
    contribution: sanitizeContribution({
      ...contribution,
      user: refreshedParty.members.find((member) => member.userId === userId)?.user
    }),
    pointTransaction: result.pointTransaction
      ? {
          id: result.pointTransaction.id,
          type: result.pointTransaction.type,
          amount: result.pointTransaction.amount,
          reason: result.pointTransaction.reason,
          sourceType: result.pointTransaction.sourceType,
          sourceId: result.pointTransaction.sourceId,
          createdAt: result.pointTransaction.createdAt
        }
      : null,
    badge: result.userBadge ? sanitizeBadge(result.userBadge.badge) : null,
    account: {
      id: result.account.id,
      userId: result.account.userId,
      pointBalance: result.account.pointBalance
    }
  };
}

async function leaveBossRaidParty(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  const currentMember = ensureCurrentActiveMember(party, userId);

  if (party.status !== 'OPEN' || (party.raid.endsAt && party.raid.endsAt < new Date())) {
    throw conflictError('Only open boss raid parties can be left');
  }

  const activeMembers = getActiveMembers(party);

  if (party.ownerId === userId && activeMembers.length > 1) {
    throw conflictError('Party owner cannot leave while other active members remain');
  }

  const now = new Date();
  const updatedMember = await bossRaidRepository.updateBossRaidPartyMemberVisibility({
    partyId: id,
    userId: currentMember.userId,
    hiddenAt: now,
    archivedAt: null,
    leftAt: now
  });
  let updatedParty = updatedMember.party;

  if (party.ownerId === userId && activeMembers.length === 1) {
    updatedParty = await bossRaidRepository.updateBossRaidPartyProgress(id, {
      status: 'CLOSED',
      lastCalculatedAt: now
    });
  }

  return sanitizeParty(updatedParty, userId);
}

async function archiveBossRaidParty(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  ensureCurrentActiveMember(party, userId);
  const refreshedParty = await recalculatePartyProgressIfNeeded(party);
  ensurePartyCanBeArchived(refreshedParty);

  const now = new Date();
  const updatedMember = await bossRaidRepository.updateBossRaidPartyMemberVisibility({
    partyId: id,
    userId,
    hiddenAt: now,
    archivedAt: now,
    leftAt: null
  });

  return sanitizeParty(updatedMember.party, userId);
}

async function restoreBossRaidParty(userId, partyId) {
  const id = parsePositiveInteger(partyId, 'partyId');
  const party = await bossRaidRepository.findBossRaidPartyById(id);

  if (!party) {
    throw notFoundError('Boss raid party not found');
  }

  const currentMember = getCurrentMember(party, userId);

  if (!currentMember) {
    throw conflictError('You are not a member of this boss raid party');
  }

  if (currentMember.leftAt) {
    throw conflictError('Left boss raid parties cannot be restored');
  }

  const updatedMember = await bossRaidRepository.updateBossRaidPartyMemberVisibility({
    partyId: id,
    userId,
    hiddenAt: null,
    archivedAt: null,
    leftAt: null
  });

  return sanitizeParty(updatedMember.party, userId);
}

module.exports = {
  acceptBossRaidInvite,
  cancelBossRaidInvite,
  claimBossRaidReward,
  createBossRaidParty,
  createBossRaidInvite,
  declineBossRaidInvite,
  getBossRaidPartyDetail,
  getBossRaidPartyInvites,
  getBossRaids,
  getMyBossRaidInvites,
  getMyBossRaidParties,
  getPublicBossRaidParties,
  archiveBossRaidParty,
  joinPublicBossRaidParty,
  joinBossRaidParty,
  leaveBossRaidParty,
  restoreBossRaidParty,
  sanitizeParty,
  sanitizeRaid
};
