const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export type ReservationStatus =
  | 'booked'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface ReservationRecord {
  id: string;
  guestName: string;
  guestPhone: string | null;
  guestEmail: string | null;
  partySize: number;
  reservationAt: string;
  reservationStatus: ReservationStatus;
  notes: string | null;
  table: {
    id: string;
    name: string;
    number: number;
  } | null;
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
    throw new Error(body.message || 'No se pudo completar la operacion de reservas.');
  }

  return body.data;
}

export function getReservationsRequest() {
  return requestApi<ReservationRecord[]>('/reservation');
}

export function createReservationRequest(payload: {
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  partySize: number;
  reservationAt: string;
  reservationStatus?: ReservationStatus;
  notes?: string;
  tableId?: string;
}) {
  return requestApi<ReservationRecord>('/reservation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateReservationRequest(
  reservationId: string,
  payload: Partial<{
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    partySize: number;
    reservationAt: string;
    reservationStatus: ReservationStatus;
    notes: string;
    tableId: string;
  }>,
) {
  return requestApi<ReservationRecord>(`/reservation/${reservationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deactivateReservationRequest(reservationId: string) {
  return requestApi<ReservationRecord>(`/reservation/${reservationId}`, {
    method: 'DELETE',
  });
}
