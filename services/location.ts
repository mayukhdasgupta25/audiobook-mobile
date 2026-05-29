/**
 * Device location — permissions, in-memory cache, and profile sync.
 */

import * as Location from 'expo-location';
import {
   clearDeviceLocationCache,
   getCachedDeviceLocation,
   isLocationCacheFresh,
   useDeviceLocationStore,
} from '@/store/deviceLocation';
import { updateUserProfile, type UserLocation } from './user';

const LOCATION_PERMISSION_MESSAGE =
   'AudioBook uses your location to personalize your experience and improve our service.';

export type { UserLocation } from './user';
export { clearDeviceLocationCache };

/**
 * Requests while-in-use location permission (sufficient for profile sync on login).
 * @returns true when foreground access is granted
 */
export async function requestLocationPermissions(): Promise<boolean> {
   const foreground = await Location.requestForegroundPermissionsAsync();
   return foreground.status === Location.PermissionStatus.GRANTED;
}

/**
 * Returns whether location services are enabled on the device.
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
   return Location.hasServicesEnabledAsync();
}

/**
 * Fetches the device's current coordinates (requests permission if needed).
 */
export async function getCurrentDeviceLocation(): Promise<UserLocation | null> {
   const servicesEnabled = await isLocationServicesEnabled();
   if (!servicesEnabled) {
      console.warn('[Location] Location services are disabled on this device.');
      return null;
   }

   const granted = await requestLocationPermissions();
   if (!granted) {
      console.warn('[Location] Location permission was not granted.');
      return null;
   }

   const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
   });

   return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      altitude: position.coords.altitude ?? null,
      timestamp: new Date(position.timestamp).toISOString(),
   };
}

let memoryFetchInFlight: Promise<UserLocation | null> | null = null;
let locationSyncInFlight: Promise<void> | null = null;

/**
 * Fetches GPS and stores coordinates in memory (no API call).
 * Safe to call multiple times — concurrent calls share one in-flight request.
 */
export async function fetchDeviceLocationInMemory(): Promise<UserLocation | null> {
   if (memoryFetchInFlight) {
      return memoryFetchInFlight;
   }

   const { isFetching } = useDeviceLocationStore.getState();
   if (isFetching) {
      return memoryFetchInFlight ?? Promise.resolve(getCachedDeviceLocation());
   }

   useDeviceLocationStore.getState().setFetching(true);

   memoryFetchInFlight = (async () => {
      try {
         const location = await getCurrentDeviceLocation();
         if (location) {
            useDeviceLocationStore.getState().setLocation(location);
         } else {
            useDeviceLocationStore.getState().setFetching(false);
         }
         return location;
      } catch (error) {
         useDeviceLocationStore.getState().setFetching(false);
         console.warn('[Location] Failed to fetch device location:', error);
         return null;
      } finally {
         memoryFetchInFlight = null;
      }
   })();

   return memoryFetchInFlight;
}

export interface SyncUserLocationOptions {
   /** When true, always GPS-fetch before PUT even if cache is fresh. */
   forceRefresh?: boolean;
}

/**
 * Updates the user profile with device location via PUT /user/profile.
 * Uses in-memory cache when fresh unless forceRefresh is set.
 */
export async function syncUserLocationToProfile(
   options: SyncUserLocationOptions = {}
): Promise<void> {
   if (locationSyncInFlight) {
      return locationSyncInFlight;
   }

   const { forceRefresh = false } = options;

   locationSyncInFlight = (async () => {
      try {
         let location: UserLocation | null = null;

         if (!forceRefresh && isLocationCacheFresh()) {
            location = getCachedDeviceLocation();
         }

         if (!location) {
            location = await fetchDeviceLocationInMemory();
         }

         if (!location) {
            return;
         }

         await updateUserProfile({ location });
         console.log('[Location] User profile updated with device location.');
      } catch (error) {
         console.warn('[Location] Failed to sync location to profile:', error);
      } finally {
         locationSyncInFlight = null;
      }
   })();

   return locationSyncInFlight;
}

export { LOCATION_PERMISSION_MESSAGE };
