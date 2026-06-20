import axios from 'axios';

/**
 * services/axios.js — Configured Axios instance for the AI Image World API.
 *
 * - Base URL targets the backend's /api/v1 (Vite proxies /api in dev).
 * - Request interceptor attaches the JWT access token when present.
 * - Response interceptor unwraps the standard envelope and normalizes errors.
 */

const TOKEN_KEY = 'aiw_access_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true, // send/receive the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

/* ----------------------------- Request interceptor ---------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ----------------------------- Token refresh (401) ---------------------------- */
// On an expired access token, transparently rotate it via the httpOnly refresh
// cookie (POST /auth/refresh) and replay the original request once. A shared
// promise de-dupes concurrent 401s so only one refresh is in flight.
let refreshing = null;

function runRefresh() {
  if (!refreshing) {
    refreshing = api
      .post('/auth/refresh')
      .then((res) => {
        const token = res?.data?.accessToken;
        setAccessToken(token || null);
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') || url.includes('/auth/refresh');

/* ---------------------------- Response interceptor ---------------------------- */
api.interceptors.response.use(
  // Success: unwrap the standard envelope → callers receive { success, data, meta }.
  (response) => response.data,
  // Error: try a one-time token refresh, otherwise normalize into a clean Error.
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status ?? 0;

    if (status === 401 && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      try {
        const token = await runRefresh();
        if (token) {
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          return api(original); // replay the original request with the new token
        }
      } catch {
        // refresh failed → fall through to normalized rejection below
      }
    }

    const data = error.response?.data;
    const normalized = new Error(data?.message || error.message || 'Request failed');
    normalized.code = data?.code || error.code || 'NETWORK_ERROR';
    normalized.status = status;
    if (data?.errors) normalized.errors = data.errors;

    // Clear a stale/invalid token so the app can re-authenticate.
    if (status === 401) setAccessToken(null);

    return Promise.reject(normalized);
  }
);

export default api;
