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

export function moderateAdminChallenge(token, challengeId, action, reason) {
  return request(`/admin/challenges/${challengeId}/moderation`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, reason })
  });
}

