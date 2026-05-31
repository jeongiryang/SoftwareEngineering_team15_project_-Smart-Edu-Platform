const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return DEFAULT_API_BASE_URL;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL;
  }

  return trimmedValue.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeApiBaseUrl(envApiBaseUrl);

export const buildRealtimeWebSocketUrl = (apiBaseUrl = API_BASE_URL) => {
  try {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch (error) {
    return 'ws://localhost:4000/ws';
  }
};

export const REALTIME_WS_URL = buildRealtimeWebSocketUrl(API_BASE_URL);
