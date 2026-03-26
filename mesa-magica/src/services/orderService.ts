const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface OrderApiResponse<T> {
  message?: string;
  data?: T;
}

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'delivered';

export type OrderPriority = 'normal' | 'high';
export type OrderStation = 'cocina' | 'bar' | 'postres';

export interface OrderExtraRecord {
  id: string;
  value: string;
  priceImpact: number;
  productExtra?: {
    id: string;
    name: string;
  };
}

export interface OrderItemRecord {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  selectedExtras: OrderExtraRecord[];
}

export interface OrderRecord {
  id: string;
  number: number;
  orderStatus: OrderStatus;
  priority: OrderPriority;
  station: OrderStation;
  observations: string | null;
  total: number;
  orderedAtLabel: string | null;
  estimatedReadyAt: string | null;
  deliveredAt: string | null;
  state: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  table?: {
    id: string;
    name: string;
    number: number;
    zone?: string;
  };
  diningSession?: {
    id: string;
    sessionToken: string;
    active: boolean;
    startedAt: string | null;
  };
  items: OrderItemRecord[];
}

export interface UpdateOrderPayload {
  orderStatus?: OrderStatus;
  priority?: OrderPriority;
  station?: OrderStation;
  observations?: string;
  estimatedReadyAt?: string | null;
  deliveredAt?: string | null;
  state?: boolean;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as OrderApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestOrderApi<T>(input: string, init?: RequestInit) {
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
    throw new Error(
      body.message || 'No se pudo completar la solicitud de pedidos.',
    );
  }

  return body.data;
}

export async function getOrdersRequest() {
  return requestOrderApi<OrderRecord[]>('/order', { method: 'GET' });
}

export async function getOrderRequest(orderId: string) {
  return requestOrderApi<OrderRecord>(`/order/${orderId}`, { method: 'GET' });
}

export async function updateOrderRequest(
  orderId: string,
  payload: UpdateOrderPayload,
) {
  return requestOrderApi<OrderRecord>(`/order/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateOrderRequest(orderId: string) {
  return requestOrderApi<OrderRecord>(`/order/${orderId}`, {
    method: 'DELETE',
  });
}
