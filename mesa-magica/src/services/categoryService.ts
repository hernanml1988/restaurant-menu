const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface CategoryApiResponse<T> {
  message?: string;
  data?: T;
}

export interface CategoryRecord {
  id: string;
  name: string;
  emoji: string;
  count: number;
  state: boolean;
  restaurant?: {
    id: string;
    name?: string;
  };
}

export interface CreateCategoryPayload {
  restaurantId: string;
  name: string;
  emoji: string;
  state?: boolean;
}

export interface UpdateCategoryPayload {
  restaurantId?: string;
  name?: string;
  emoji?: string;
  state?: boolean;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as CategoryApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestCategoryApi<T>(input: string, init?: RequestInit) {
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
      body.message || 'No se pudo completar la solicitud de categorias.',
    );
  }

  return body.data;
}

export async function getCategoriesRequest() {
  return requestCategoryApi<CategoryRecord[]>('/category', { method: 'GET' });
}

export async function createCategoryRequest(payload: CreateCategoryPayload) {
  return requestCategoryApi<CategoryRecord>('/category', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryRequest(
  categoryId: string,
  payload: UpdateCategoryPayload,
) {
  return requestCategoryApi<CategoryRecord>(`/category/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateCategoryRequest(categoryId: string) {
  return requestCategoryApi<CategoryRecord>(`/category/${categoryId}`, {
    method: 'DELETE',
  });
}
