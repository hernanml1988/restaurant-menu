export type InternalModuleRole = 'admin' | 'kitchen';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: InternalModuleRole;
}

interface AuthResponseBody {
  message?: string;
  data?: AuthenticatedUser;
}

interface LoginPayload {
  email: string;
  password: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

async function parseResponseBody(response: Response) {
  try {
    return (await response.json()) as AuthResponseBody;
  } catch {
    return {};
  }
}

export async function loginRequest(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body = await parseResponseBody(response);

  if (!response.ok || !body.data) {
    return {
      ok: false as const,
      message: body.message || 'No se pudo iniciar sesion.',
    };
  }

  return {
    ok: true as const,
    user: body.data,
  };
}

export async function validateSessionRequest() {
  const response = await fetch(`${API_BASE_URL}/auth/validate-sesion`, {
    method: 'GET',
    credentials: 'include',
  });

  return response.ok;
}

export async function logoutRequest() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
