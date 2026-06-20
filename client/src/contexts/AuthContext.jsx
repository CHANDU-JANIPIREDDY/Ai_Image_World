import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/services/auth.api';
import { setAccessToken } from '@/services/axios';

/**
 * AuthContext — admin authentication state for the dashboard.
 *
 * On mount it tries GET /auth/me; if the access token is missing/expired, the
 * axios interceptor silently rotates it via the refresh cookie, so a returning
 * admin is restored without re-login. Exposes login/logout + the current user.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'guest'

  // Restore session on first load.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authApi.getMe();
        if (alive) {
          setUser(res.data);
          setStatus('authed');
        }
      } catch {
        if (alive) {
          setUser(null);
          setStatus('guest');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    setStatus('authed');
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authed',
      login,
      logout,
    }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
