const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ServiceRequestApiResponse<T> {
  message?: string;
  data?: T;
}

export type ServiceRequestType = 'waiter' | 'bill' | 'help';

export interface CreatePublicServiceRequestPayload {
  sessionToken: string;
  type: ServiceRequestType;
  notes?: string;
}

export interface ServiceRequestRecord {
  id: string;
  type: ServiceRequestType;
  requestStatus: 'pending' | 'attended' | 'cancelled';
  notes: string | null;
  createdAt: string;
  attendedAt?: string | null;
  table?: {
    id: string;
    name: string;
    number: number;
  };
  diningSession?: {
    id: string;
    sessionToken: string;
  };
}

export interface UpdateServiceRequestPayload {
  requestStatus?: 'pending' | 'attended' | 'cancelled';
  notes?: string;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ServiceRequestApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestServiceRequestApi<T>(input: string, init?: RequestInit) {
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
      body.message ||
        'No se pudo completar la solicitud de asistencia del cliente.',
    );
  }

  return body.data;
}

export async function createPublicServiceRequestRequest(
  payload: CreatePublicServiceRequestPayload,
) {
  return requestServiceRequestApi<ServiceRequestRecord>('/service-request/public', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getServiceRequestsRequest() {
  return requestServiceRequestApi<ServiceRequestRecord[]>('/service-request', {
    method: 'GET',
    credentials: 'include',
  });
}

export async function updateServiceRequestRequest(
  serviceRequestId: string,
  payload: UpdateServiceRequestPayload,
) {
  return requestServiceRequestApi<ServiceRequestRecord>(
    `/service-request/${serviceRequestId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
}
