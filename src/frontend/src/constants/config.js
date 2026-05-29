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
