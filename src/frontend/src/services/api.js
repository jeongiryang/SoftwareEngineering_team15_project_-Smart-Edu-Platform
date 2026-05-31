import { API_BASE_URL } from '../constants/config';

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('API response parsing failed');
  }
}

export async function request(path, options = {}) {
  const method = options.method || 'GET';

  const { headers: customHeaders, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...(customHeaders || {})
    },
    ...restOptions
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(data.message || `API request failed: ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

function buildQueryString(params = {}) {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length ? `?${pairs.join('&')}` : '';
}

const FOCUS_SESSION_QUEUE_KEY = 'smartEdu.pendingFocusSessionQueue';
const FOCUS_SESSION_QUEUE_LIMIT = 20;
const FOCUS_SESSION_FIELDS = ['taskId', 'startedAt', 'endedAt', 'durationMs', 'memo'];

function getStorage() {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return null;
  }

  return globalThis.localStorage;
}

function readFocusSessionQueue() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const parsed = JSON.parse(storage.getItem(FOCUS_SESSION_QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeFocusSessionQueue(queue) {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(FOCUS_SESSION_QUEUE_KEY, JSON.stringify(queue.slice(0, FOCUS_SESSION_QUEUE_LIMIT)));
    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeFocusSessionPayload(payload = {}) {
  return FOCUS_SESSION_FIELDS.reduce((nextPayload, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      nextPayload[field] = payload[field];
    }

    return nextPayload;
  }, {});
}

function createQueueItem(payload, reason = 'network') {
  return {
    localId: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload: sanitizeFocusSessionPayload(payload),
    reason,
    queuedAt: new Date().toISOString()
  };
}

function shouldQueueFocusSessionError(error) {
  return !error.status || error.status >= 500;
}

export function getPendingFocusSessionQueue() {
  return readFocusSessionQueue();
}

export function enqueueFocusSession(payload, reason = 'manual') {
  const queue = readFocusSessionQueue();
  const nextQueue = [createQueueItem(payload, reason), ...queue].slice(0, FOCUS_SESSION_QUEUE_LIMIT);

  return writeFocusSessionQueue(nextQueue);
}

export function registerUser({ loginId, password, name }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ loginId, password, name })
  });
}

export function loginUser({ loginId, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password })
  });
}

export function getCurrentUser(token) {
  return request('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getSystemStatus() {
  return request('/system/status');
}

export function updateCurrentUser(token, payload) {
  return request('/users/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getMyActivityStats(token) {
  return request('/users/me/activity', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getPublicProfile(token, userId) {
  return request(`/users/${encodeURIComponent(userId)}/public-profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function searchUsers(token, keyword) {
  return request(`/users/search${buildQueryString({ keyword })}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getFriends(token) {
  return request('/friends', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getFriendRequests(token) {
  return request('/friends/requests', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function sendFriendRequest(token, userId) {
  return request('/friends/requests', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
}

export function respondToFriendRequest(token, requestId, action) {
  return request(`/friends/requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });
}

export function deleteFriend(token, friendId) {
  return request(`/friends/${friendId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMessageThreads(token) {
  return request('/messages/threads', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMessageThread(token, threadId) {
  return request(`/messages/threads/${threadId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function startMessageThread(token, friendId) {
  return request('/messages/threads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ friendId })
  });
}

export function sendDirectMessage(token, threadId, content) {
  return request(`/messages/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
}

export function markMessageThreadRead(token, threadId) {
  return request(`/messages/threads/${threadId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function changeCurrentUserPassword(token, payload) {
  return request('/users/me/password', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function deleteCurrentUser(token, payload) {
  return request('/users/me', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getMyRewards(token) {
  return request('/rewards/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function claimRewardQuest(token, questId) {
  return request(`/rewards/quests/${questId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function getShopItems(token) {
  return request('/shop/items', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMyShop(token) {
  return request('/shop/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function purchaseShopItem(token, itemId) {
  return request(`/shop/items/${itemId}/purchase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function equipShopItem(token, itemId) {
  return request(`/shop/items/${itemId}/equip`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function unequipShopItem(token, type) {
  return request('/shop/unequip', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type })
  });
}

export function getBossRaids(token) {
  return request('/boss-raids', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMyBossRaidParties(token) {
  return request('/boss-raids/parties/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getPublicBossRaidParties(token, raidId = null) {
  const query = raidId ? `?raidId=${encodeURIComponent(raidId)}` : '';

  return request(`/boss-raids/parties/public${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createBossRaidParty(token, payload) {
  return request('/boss-raids/parties', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function joinBossRaidParty(token, payload) {
  return request('/boss-raids/parties/join', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function joinPublicBossRaidParty(token, partyId) {
  return request(`/boss-raids/parties/${partyId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function getBossRaidPartyDetail(token, partyId) {
  return request(`/boss-raids/parties/${partyId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function claimBossRaidReward(token, partyId) {
  return request(`/boss-raids/parties/${partyId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function getCollaborativeQuests(token) {
  return request('/collaborative-quests', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getCollaborativeQuestDetail(token, questId) {
  return request(`/collaborative-quests/${questId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCollaborativeQuest(token, payload) {
  return request('/collaborative-quests', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function joinCollaborativeQuest(token, questId) {
  return request(`/collaborative-quests/${questId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function addCollaborativeQuestContribution(token, questId, payload) {
  return request(`/collaborative-quests/${questId}/contributions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function claimCollaborativeQuestReward(token, questId) {
  return request(`/collaborative-quests/${questId}/claim`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function getSchedules(token) {
  return request('/schedules', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createSchedule(token, payload) {
  return request('/schedules', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getScheduleDetail(token, scheduleId) {
  return request(`/schedules/${scheduleId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateSchedule(token, scheduleId, payload) {
  return request(`/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function deleteSchedule(token, scheduleId) {
  return request(`/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getTasks(token, scheduleId) {
  const query = scheduleId ? `?scheduleId=${scheduleId}` : '';

  return request(`/tasks${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getFocusSessions(token, params = {}) {
  return request(`/focus-sessions${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function recordFocusSession(token, payload, options = {}) {
  const { queueOnFailure = true } = options;
  const safePayload = sanitizeFocusSessionPayload(payload);

  try {
    return await request('/focus-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(safePayload)
    });
  } catch (error) {
    if (queueOnFailure && shouldQueueFocusSessionError(error)) {
      const queued = enqueueFocusSession(safePayload, error.status ? `http-${error.status}` : 'network');
      error.queued = queued;
      error.message = queued
        ? '네트워크 문제로 집중 기록을 임시 저장했습니다. 연결이 회복되면 다시 전송해 주세요.'
        : '집중 기록 저장에 실패했고, 현재 브라우저에서 임시 저장도 사용할 수 없습니다.';
    }

    throw error;
  }
}

export async function retryPendingFocusSessions(token) {
  const queue = readFocusSessionQueue();
  const remaining = [];
  const submitted = [];

  for (const item of queue) {
    try {
      const result = await request('/focus-sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item.payload)
      });

      submitted.push(result.focusSession);
    } catch (error) {
      remaining.push({
        ...item,
        lastTriedAt: new Date().toISOString(),
        lastError: error.status ? `http-${error.status}` : 'network'
      });
    }
  }

  writeFocusSessionQueue(remaining);

  return {
    submitted,
    failed: remaining.length,
    remaining
  };
}

export function getStatisticsSummary(token, params = {}) {
  return request(`/statistics/summary${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getStatisticsHeatmap(token, params = {}) {
  return request(`/statistics/heatmap${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createTask(token, payload) {
  return request('/tasks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function updateTask(token, taskId, payload) {
  return request(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function updateTaskStatus(token, taskId, status) {
  return request(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
}

export function deleteTask(token, taskId) {
  return request(`/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function askAIQuestion(token, { question, noteId, allowTruncate }) {
  return request('/ai/questions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ question, noteId, allowTruncate })
  });
}

export function getAIChatRooms(token) {
  return request('/ai/chat-rooms', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createAIChatRoom(token, payload = {}) {
  return request('/ai/chat-rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function createAIChatMessage(token, roomId, payload) {
  return request(`/ai/chat-rooms/${roomId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function deleteAIChatRoom(token, roomId) {
  return request(`/ai/chat-rooms/${roomId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getAIRecommendation(token) {
  return request('/ai/recommendations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function summarizeText(token, { content, allowTruncate }) {
  return request('/ai/summary', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content, allowTruncate })
  });
}

export function analyzeWrongAnswer(token, { problem, userAnswer, noteId, allowTruncate }) {
  return request('/ai/wrong-answers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ problem, userAnswer, noteId, allowTruncate })
  });
}

export function getAccessibilityPreferences(token) {
  return request('/accessibility/preferences', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateAccessibilityPreferences(token, preferences) {
  return request('/accessibility/preferences', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(preferences)
  });
}

export function requestTextToSpeech(token, { text, voiceType }) {
  return request('/accessibility/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text, voiceType })
  });
}

export function saveSpeechTranscript(token, { transcript }) {
  return request('/accessibility/stt', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ transcript })
  });
}

export function createReviewReminder(token, { title, task, message, scheduledAt }) {
  return request('/accessibility/review-reminders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, task, message, scheduledAt })
  });
}

export function getReviewReminders(token) {
  return request('/accessibility/review-reminders', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getAdminUsers(token) {
  return request('/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateAdminUserStatus(token, userId, status, reason) {
  return request(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, reason })
  });
}

export function getAdminReports(token) {
  return request('/admin/reports', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getAdminMaintenance(token) {
  return request('/admin/system/maintenance', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateAdminMaintenance(token, payload) {
  return request('/admin/system/maintenance', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function sendAdminNotice(token, payload) {
  return request('/admin/system/notice', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function moderateAdminPost(token, postId, action, reason) {
  return request(`/admin/posts/${postId}/moderation`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, reason })
  });
}

export function moderateAdminComment(token, commentId, action, reason) {
  return request(`/admin/comments/${commentId}/moderation`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, reason })
  });
}

export function getCommunityPosts(token, params = {}) {
  return request(`/community/posts${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getCommunityPost(token, postId) {
  return request(`/community/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityPost(token, payload) {
  return request('/community/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function updateCommunityPost(token, postId, payload) {
  return request(`/community/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function deleteCommunityPost(token, postId) {
  return request(`/community/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getCommunityComments(token, postId, params = {}) {
  return request(`/community/posts/${postId}/comments${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityComment(token, postId, payload) {
  return request(`/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function updateCommunityComment(token, commentId, payload) {
  return request(`/community/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function deleteCommunityComment(token, commentId) {
  return request(`/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityReaction(token, postId, type) {
  return request(`/community/posts/${postId}/reactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type })
  });
}

export function deleteCommunityReaction(token, postId) {
  return request(`/community/posts/${postId}/reactions`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityCommentReaction(token, commentId, type) {
  return request(`/community/comments/${commentId}/reactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ type })
  });
}

export function deleteCommunityCommentReaction(token, commentId) {
  return request(`/community/comments/${commentId}/reactions`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityBookmark(token, postId) {
  return request(`/community/posts/${postId}/bookmarks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function deleteCommunityBookmark(token, postId) {
  return request(`/community/posts/${postId}/bookmarks`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getCommunityBookmarks(token, params = {}) {
  return request(`/community/bookmarks${buildQueryString(params)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function reportCommunityPost(token, postId, reason) {
  return request(`/community/posts/${postId}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
}

export function reportCommunityComment(token, commentId, reason) {
  return request(`/community/comments/${commentId}/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
}
