const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface AuditLogRecord {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

export async function getAuditLogsRequest(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/audit-log?limit=${limit}`, {
    credentials: 'include',
  });
  const body = await parseResponseBody<AuditLogRecord[]>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo cargar la bitacora.');
  }

  return body.data;
}
