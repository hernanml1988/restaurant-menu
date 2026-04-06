const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface CashSessionRecord {
  id: string;
  sessionStatus: 'open' | 'closed';
  openingAmount: number;
  expectedAmount: number;
  closingAmount: number | null;
  differenceAmount: number | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody<T>(response);
  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo completar la operacion de caja.');
  }

  return body.data;
}

export function getCurrentCashSessionRequest() {
  return requestApi<CashSessionRecord | null>('/cash-session/current');
}

export function getCashSessionHistoryRequest() {
  return requestApi<CashSessionRecord[]>('/cash-session/history');
}

export function openCashSessionRequest(payload: {
  openingAmount: number;
  notes?: string;
}) {
  return requestApi<CashSessionRecord>('/cash-session/open', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function closeCashSessionRequest(payload: {
  closingAmount: number;
  notes?: string;
}) {
  return requestApi<CashSessionRecord>('/cash-session/close', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
