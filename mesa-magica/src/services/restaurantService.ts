import {
  defaultRestaurantProfile,
  type RestaurantProfile,
} from '@/data/restaurantProfile';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface RestaurantApiResponse<T> {
  message?: string;
  data?: T;
}

export interface RestaurantRecord {
  id: string;
  name: string | null;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  logoDataUrl: string | null;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as RestaurantApiResponse<T>;
  } catch {
    return {};
  }
}

function mapRestaurantProfile(
  restaurant: RestaurantRecord | undefined,
): RestaurantProfile {
  if (!restaurant) {
    return defaultRestaurantProfile;
  }

  return {
    name: restaurant.name || defaultRestaurantProfile.name,
    tagline: restaurant.tagline || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    address: restaurant.address || '',
    description: restaurant.description || '',
    logoDataUrl: restaurant.logoDataUrl,
  };
}

async function requestRestaurantApi<T>(
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
    throw new Error(
      body.message || 'No se pudo completar la solicitud del restaurante.',
    );
  }

  return body.data;
}

export async function getCurrentRestaurantProfileRequest() {
  const restaurant = await requestRestaurantApi<RestaurantRecord>(
    '/restaurant/public/current',
    {
      method: 'GET',
    },
  );

  return mapRestaurantProfile(restaurant);
}

export async function getCurrentRestaurantRequest() {
  return requestRestaurantApi<RestaurantRecord>('/restaurant/public/current', {
    method: 'GET',
  });
}

export async function updateCurrentRestaurantProfileRequest(
  payload: RestaurantProfile,
) {
  const restaurant = await requestRestaurantApi<RestaurantRecord>(
    '/restaurant/current',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return mapRestaurantProfile(restaurant);
}

export async function resetCurrentRestaurantProfileRequest() {
  const restaurant = await requestRestaurantApi<RestaurantRecord>(
    '/restaurant/current/reset',
    {
      method: 'POST',
    },
  );

  return mapRestaurantProfile(restaurant);
}
