const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ProductApiResponse<T> {
  message?: string;
  data?: T;
}

export interface ProductExtraRecord {
  id: string;
  name: string;
  price: number;
  type: 'add' | 'remove' | 'choice';
  options: string[];
  state: boolean;
}

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  gradient: string | null;
  available: boolean;
  popular: boolean;
  promo: boolean;
  allergens: string[];
  state: boolean;
  category?: {
    id: string;
    name: string;
    emoji: string;
  };
  restaurant?: {
    id: string;
    name?: string;
  };
  extras: ProductExtraRecord[];
}

export interface CreateProductPayload {
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  gradient?: string;
  available?: boolean;
  popular?: boolean;
  promo?: boolean;
  allergens?: string[];
  state?: boolean;
}

export interface UpdateProductPayload {
  restaurantId?: string;
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  gradient?: string;
  available?: boolean;
  popular?: boolean;
  promo?: boolean;
  allergens?: string[];
  state?: boolean;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ProductApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestProductApi<T>(input: string, init?: RequestInit) {
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
      body.message || 'No se pudo completar la solicitud de productos.',
    );
  }

  return body.data;
}

export async function getProductsRequest() {
  return requestProductApi<ProductRecord[]>('/product', { method: 'GET' });
}

export async function createProductRequest(payload: CreateProductPayload) {
  return requestProductApi<ProductRecord>('/product', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProductRequest(
  productId: string,
  payload: UpdateProductPayload,
) {
  return requestProductApi<ProductRecord>(`/product/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateProductRequest(productId: string) {
  return requestProductApi<ProductRecord>(`/product/${productId}`, {
    method: 'DELETE',
  });
}
