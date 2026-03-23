export type InternalModuleRole = 'admin' | 'kitchen';

export interface InternalUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: InternalModuleRole;
}

export interface InternalSession {
  user: Omit<InternalUser, 'password'>;
}

const SESSION_STORAGE_KEY = 'mesa-magica.internal-session';

const internalUsers: InternalUser[] = [
  {
    id: 'admin-demo',
    email: 'admin@mesamagica.local',
    password: 'Admin123*',
    fullName: 'Valentina Soto',
    role: 'admin',
  },
  {
    id: 'kitchen-demo',
    email: 'cocina@mesamagica.local',
    password: 'Cocina123*',
    fullName: 'Equipo Cocina',
    role: 'kitchen',
  },
];

export function getInternalDemoCredentials() {
  return internalUsers.map(({ email, password, role }) => ({
    email,
    password,
    role,
  }));
}

export function authenticateInternalUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = internalUsers.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.password === password,
  );

  if (!user) {
    return null;
  }

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

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
