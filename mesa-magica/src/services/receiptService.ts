const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface ReceiptRecord {
  id: string;
  code: string;
  type: 'prebill' | 'payment';
  totalAmount: number;
  printableHtml: string;
  issuedBy: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
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
    throw new Error(body.message || 'No se pudo completar la operacion de comprobantes.');
  }

  return body.data;
}

export function getReceiptsRequest() {
  return requestApi<ReceiptRecord[]>('/receipt');
}

export function createReceiptRequest(payload: {
  sessionToken: string;
  type: 'prebill' | 'payment';
  paymentId?: string;
}) {
  return requestApi<ReceiptRecord>('/receipt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
