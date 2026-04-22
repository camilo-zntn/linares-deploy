interface AuthConfig {
  apiUrl: string;
  tokenKey: string;
}

import { API_BASE_URL } from './api';

export const authConfig: AuthConfig = {
  apiUrl: `${API_BASE_URL}/api`,
  tokenKey: 'token'
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(authConfig.tokenKey);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(authConfig.tokenKey, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(authConfig.tokenKey);
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export default authConfig;
