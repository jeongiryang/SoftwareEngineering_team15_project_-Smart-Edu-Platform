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
  const isGet = method.toUpperCase() === 'GET';
  const url = isGet
    ? `${API_BASE_URL}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`
    : `${API_BASE_URL}${path}`;

  const { headers: customHeaders, ...restOptions } = options;

  const response = await fetch(url, {
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
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}

function buildQueryString(params = {}) {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length ? `?${pairs.join('&')}` : '';
}

export function registerUser({ email, password, name }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
}

export function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function getCurrentUser(token) {
  return request('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
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
