const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface DiningSessionApiResponse<T> {
  message?: string;
  data?: T;
}

export type DiningSessionAccountStatus =
  | 'open'
  | 'payment-pending'
  | 'paid'
  | 'closed';

export interface DiningSessionRecord {
  id: string;
  sessionToken: string;
  active: boolean;
  startedAt: string | null;
  closedAt: string | null;
  accountStatus: DiningSessionAccountStatus;
  totalAccount: number;
  paidAmount: number;
  tipAmount: number;
  receivedAmount: number;
  changeAmount: number;
  balanceDue: number;
  orderCount: number;
  paymentCount: number;
  restaurant?: {
    id: string;
    name: string;
    tagline?: string | null;
    logoDataUrl?: string | null;
  };
  table?: {
    id: string;
    number: number;
    name: string;
    zone: string;
    qrCode: string;
  };
  orders: Array<{
    id: string;
    number: number;
    orderStatus: 'received' | 'preparing' | 'ready' | 'delivered';
    priority: 'normal' | 'high';
    station: 'cocina' | 'bar' | 'postres';
    observations: string | null;
    total: number;
    orderedAtLabel: string | null;
    estimatedReadyAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      notes: string | null;
      selectedExtras: Array<{
        id: string;
        value: string;
        priceImpact: number;
        productExtra?: {
          id: string;
          name: string;
        };
      }>;
    }>;
  }>;
  payments?: Array<{
    id: string;
    method: 'cash' | 'card' | 'transfer';
    paymentStatus: 'pending' | 'paid' | 'cancelled';
    amount: number;
    tipAmount: number;
    receivedAmount: number;
    changeAmount: number;
    payerName: string | null;
    reference: string | null;
    notes: string | null;
    paidAt: string | null;
    createdBy: string;
  }>;
}

export interface StartDiningSessionPayload {
  qrCode: string;
  existingSessionToken?: string;
}

export interface CloseDiningSessionPayload {
  closedBy?: string;
  notes?: string;
}

export interface ReopenDiningSessionPayload {
  reopenedBy?: string;
  reason?: string;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as DiningSessionApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestDiningSessionApi<T>(input: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    credentials: 'omit',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody<T>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(
      body.message || 'No se pudo completar la solicitud de sesion del cliente.',
    );
  }

  return body.data;
}

async function requestInternalDiningSessionApi<T>(
  input: string,
  init?: RequestInit,
) {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody<T>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo completar la operacion sobre la cuenta.');
  }

  return body.data;
}

export async function startDiningSessionRequest(
  payload: StartDiningSessionPayload,
) {
  return requestDiningSessionApi<DiningSessionRecord>('/dining-session/public/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDiningSessionRequest(sessionToken: string) {
  return requestDiningSessionApi<DiningSessionRecord>(
    `/dining-session/public/${sessionToken}`,
    {
      method: 'GET',
    },
  );
}

export async function getDiningSessionAccountRequest(sessionToken: string) {
  return requestInternalDiningSessionApi<DiningSessionRecord>(
    `/dining-session/${sessionToken}/account`,
    {
      method: 'GET',
    },
  );
}

export async function markDiningSessionPaymentPendingRequest(sessionToken: string) {
  return requestInternalDiningSessionApi<DiningSessionRecord>(
    `/dining-session/${sessionToken}/payment-pending`,
    {
      method: 'PATCH',
    },
  );
}

export async function closeDiningSessionRequest(
  sessionToken: string,
  payload: CloseDiningSessionPayload,
) {
  return requestInternalDiningSessionApi<{
    sessionToken: string;
    closedAt: string;
    active: boolean;
    accountStatus: DiningSessionAccountStatus;
  }>(`/dining-session/${sessionToken}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function reopenDiningSessionRequest(
  sessionToken: string,
  payload: ReopenDiningSessionPayload,
) {
  return requestInternalDiningSessionApi<DiningSessionRecord>(
    `/dining-session/${sessionToken}/reopen`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}
