import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  authenticateInternalUser,
  clearInternalSession,
  InternalModuleRole,
  readInternalSession,
  saveInternalSession,
} from '@/data/internalAuth';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: InternalModuleRole;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthUser | null;
  login: (payload: LoginPayload) => { ok: true; role: InternalModuleRole } | { ok: false; message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedSession = readInternalSession();
    setUser(storedSession?.user ?? null);
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isReady,
      user,
      login: ({ email, password }) => {
        const authenticatedUser = authenticateInternalUser(email, password);

        if (!authenticatedUser) {
          return {
            ok: false as const,
            message: 'Credenciales invalidas. Revisa el correo y la contrasena.',
          };
        }

        saveInternalSession({ user: authenticatedUser });
        setUser(authenticatedUser);

        return {
          ok: true as const,
          role: authenticatedUser.role,
        };
      },
      logout: () => {
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
