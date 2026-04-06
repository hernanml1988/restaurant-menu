const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface PaymentApiResponse<T> {
  message?: string;
  data?: T;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  tipAmount: number;
  receivedAmount: number;
  changeAmount: number;
  payerName: string | null;
  reference: string | null;
  notes: string | null;
  paidAt: string | null;
  createdBy: string;
  diningSession?: {
    id: string;
    sessionToken: string;
  };
  table?: {
    id: string;
    name: string;
    number: number;
  };
}

export interface CreatePaymentPayload {
  sessionToken: string;
  method: PaymentMethod;
  amount: number;
  tipAmount?: number;
  receivedAmount?: number;
  payerName?: string;
  reference?: string;
  notes?: string;
}

export interface CancelPaymentPayload {
  notes?: string;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as PaymentApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestPaymentApi<T>(input: string, init?: RequestInit) {
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
    throw new Error(body.message || 'No se pudo completar la operacion de cobro.');
  }

  return body.data;
}

export async function createPaymentRequest(payload: CreatePaymentPayload) {
  return requestPaymentApi<{
    payment: PaymentRecord;
  }>(`/payment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentsBySessionRequest(sessionToken: string) {
  return requestPaymentApi<PaymentRecord[]>(`/payment/session/${sessionToken}`, {
    method: 'GET',
  });
}

export async function cancelPaymentRequest(
  paymentId: string,
  payload: CancelPaymentPayload,
) {
  return requestPaymentApi<{
    payment: PaymentRecord;
  }>(`/payment/${paymentId}`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}
