import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStorage, StudentUser, isApiError } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/notifications';

interface AuthState {
  user: StudentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = await tokenStorage.get();
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.auth.me();
      setUser(data);
    } catch {
      setUser(null);
      await tokenStorage.clear();
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await api.auth.login(email, password);
      await tokenStorage.set(data.token);
      await tokenStorage.setRefresh(data.refreshToken);
      setUser(data.user);
      // Register push token post-login (non-blocking)
      registerForPushNotificationsAsync().catch(() => {});
    } catch (e) {
      if (isApiError(e)) {
        setError(e.response?.data?.message ?? 'Identifiants incorrects');
      } else {
        setError('Erreur de connexion');
      }
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore — token may be invalid
    }
    await tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
