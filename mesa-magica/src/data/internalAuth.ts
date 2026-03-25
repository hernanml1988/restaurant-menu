import type { AuthenticatedUser, InternalModuleRole } from '@/services/authService';

export type { InternalModuleRole };

export interface InternalSession {
  user: AuthenticatedUser;
}

const SESSION_STORAGE_KEY = 'mesa-magica.internal-session';

export function readInternalSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as InternalSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function saveInternalSession(session: InternalSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearInternalSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
