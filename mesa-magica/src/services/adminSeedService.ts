const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface AdminSeedResult {
  counters: Record<string, number>;
  credentials: Record<string, string>;
  sessionToken: string;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

export async function seedAdminDataRequest() {
  const response = await fetch(`${API_BASE_URL}/user/admin-seed`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const body = await parseResponseBody<AdminSeedResult>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo cargar los datos de prueba.');
  }

  return body.data;
}
