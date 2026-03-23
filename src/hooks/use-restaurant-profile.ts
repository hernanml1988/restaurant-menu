import { useEffect, useState } from 'react';
import {
  defaultRestaurantProfile,
  readRestaurantProfile,
  RestaurantProfile,
  saveRestaurantProfile,
} from '@/data/restaurantProfile';

export function useRestaurantProfile() {
  const [profile, setProfile] = useState<RestaurantProfile>(defaultRestaurantProfile);

  useEffect(() => {
    setProfile(readRestaurantProfile());
  }, []);

  const updateProfile = (nextProfile: RestaurantProfile) => {
    saveRestaurantProfile(nextProfile);
    setProfile(nextProfile);
  };

  const resetProfile = () => {
    updateProfile(defaultRestaurantProfile);
  };

  return {
    profile,
    updateProfile,
    resetProfile,
  };
}
