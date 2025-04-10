interface AuthConfig {
  apiUrl: string;
  tokenKey: string;
}

export const authConfig: AuthConfig = {
  apiUrl: 'http://localhost:5000/api',
  tokenKey: 'authToken'
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