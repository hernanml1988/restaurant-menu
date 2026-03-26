const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

export type TableStatus =
  | 'free'
  | 'occupied'
  | 'with-order'
  | 'pending-payment';

export interface TableRecord {
  id: string;
  number: number;
  name: string;
  capacity: number;
  zone: string;
  qrCode: string;
  serviceStatus: TableStatus;
  activeOrders: number;
  state: boolean;
  restaurant?: {
    id: string;
    name?: string;
  };
}

interface TableApiResponse<T> {
  message?: string;
  data?: T;
}

export interface CreateTablePayload {
  restaurantId: string;
  number: number;
  name: string;
  capacity: number;
  zone: string;
  qrCode?: string;
  serviceStatus?: TableStatus;
  activeOrders?: number;
  state?: boolean;
}

export interface UpdateTablePayload {
  restaurantId?: string;
  number?: number;
  name?: string;
  capacity?: number;
  zone?: string;
  qrCode?: string;
  serviceStatus?: TableStatus;
  activeOrders?: number;
  state?: boolean;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as TableApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestTableApi<T>(
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
    throw new Error(body.message || 'No se pudo completar la solicitud de mesas.');
  }

  return body.data;
}

export async function getTablesRequest() {
  return requestTableApi<TableRecord[]>('/table', {
    method: 'GET',
  });
}

export async function createTableRequest(payload: CreateTablePayload) {
  return requestTableApi<TableRecord>('/table', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTableRequest(
  tableId: string,
  payload: UpdateTablePayload,
) {
  return requestTableApi<TableRecord>(`/table/${tableId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateTableRequest(tableId: string) {
  return requestTableApi<TableRecord>(`/table/${tableId}`, {
    method: 'DELETE',
  });
}
