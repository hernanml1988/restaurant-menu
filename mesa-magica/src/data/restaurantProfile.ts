export interface RestaurantProfile {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  logoDataUrl: string | null;
}

export const restaurantProfileStorageKey = 'mesa-magica.restaurant-profile';

export const defaultRestaurantProfile: RestaurantProfile = {
  name: 'Mesa Viva',
  tagline: 'Sabores que conectan',
  phone: '+56 9 1234 5678',
  email: 'contacto@mesaviva.cl',
  address: 'Av. Costanera 245, Santiago',
  description:
    'Restaurante orientado a una experiencia moderna de sala, pedidos digitales y operacion coordinada entre cliente, cocina y administracion.',
  logoDataUrl: null,
};

export function readRestaurantProfile(): RestaurantProfile {
  if (typeof window === 'undefined') {
    return defaultRestaurantProfile;
  }

  const rawValue = window.localStorage.getItem(restaurantProfileStorageKey);

  if (!rawValue) {
    return defaultRestaurantProfile;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<RestaurantProfile>;

    return {
      ...defaultRestaurantProfile,
      ...parsedValue,
    };
  } catch {
    return defaultRestaurantProfile;
  }
}

export function saveRestaurantProfile(profile: RestaurantProfile) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    restaurantProfileStorageKey,
    JSON.stringify(profile),
  );
}
