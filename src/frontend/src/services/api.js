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
  const { headers: customHeaders, ...restOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

