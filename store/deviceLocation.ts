/**
 * In-memory device location cache (not persisted).
 */

import { create } from 'zustand';
import type { UserLocation } from '@/services/user';

export const DEFAULT_LOCATION_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

interface DeviceLocationState {
   location: UserLocation | null;
   fetchedAt: number | null;
   isFetching: boolean;
   setLocation: (location: UserLocation) => void;
   setFetching: (isFetching: boolean) => void;
   clearLocation: () => void;
}

const initialState = {
   location: null as UserLocation | null,
   fetchedAt: null as number | null,
   isFetching: false,
};

export const useDeviceLocationStore = create<DeviceLocationState>((set) => ({
   ...initialState,
   setLocation: (location) =>
      set({ location, fetchedAt: Date.now(), isFetching: false }),
   setFetching: (isFetching) => set({ isFetching }),
   clearLocation: () => set(initialState),
}));

export function getCachedDeviceLocation(): UserLocation | null {
   return useDeviceLocationStore.getState().location;
}

export function getLocationFetchedAt(): number | null {
   return useDeviceLocationStore.getState().fetchedAt;
}

export function isLocationCacheFresh(
   maxAgeMs: number = DEFAULT_LOCATION_CACHE_MAX_AGE_MS
): boolean {
   const { location, fetchedAt } = useDeviceLocationStore.getState();
   if (!location || fetchedAt === null) {
      return false;
   }
   return Date.now() - fetchedAt <= maxAgeMs;
}

export function clearDeviceLocationCache(): void {
   useDeviceLocationStore.getState().clearLocation();
}
