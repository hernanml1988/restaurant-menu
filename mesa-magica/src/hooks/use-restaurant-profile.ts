import { useQuery } from '@tanstack/react-query';
import {
  defaultRestaurantProfile,
} from '@/data/restaurantProfile';
import { getCurrentRestaurantProfileRequest } from '@/services/restaurantService';

export function useRestaurantProfile() {
  const query = useQuery({
    queryKey: ['restaurant', 'profile'],
    queryFn: getCurrentRestaurantProfileRequest,
  });

  return {
    profile: query.data ?? defaultRestaurantProfile,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
