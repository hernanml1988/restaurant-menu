import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearInternalSession, readInternalSession, saveInternalSession } from '@/data/internalAuth';
import {
  type AuthenticatedUser,
  type InternalModuleRole,
  loginRequest,
  logoutRequest,
  validateSessionRequest,
} from '@/services/authService';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthenticatedUser | null;
  login: (
    payload: LoginPayload,
  ) => Promise<{ ok: true; role: InternalModuleRole } | { ok: false; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncSession = async () => {
      const storedSession = readInternalSession();

      if (!storedSession?.user) {
        setUser(null);
        setIsReady(true);
        return;
      }

      const isValidSession = await validateSessionRequest().catch(() => false);

      if (!isValidSession) {
        clearInternalSession();
        setUser(null);
        setIsReady(true);
        return;
      }

      setUser(storedSession.user);
      setIsReady(true);
    };

    void syncSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isReady,
      user,
      login: async ({ email, password }) => {
        const result = await loginRequest({ email, password });

        if (!result.ok) {
          return {
            ok: false as const,
            message: result.message,
          };
        }

        saveInternalSession({ user: result.user });
        setUser(result.user);

        return {
          ok: true as const,
          role: result.user.role,
        };
      },
      logout: async () => {
        await logoutRequest().catch(() => undefined);
        clearInternalSession();
        setUser(null);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
