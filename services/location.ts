/**
 * Device location — permissions, in-memory cache, and profile sync.
 */

import * as Location from 'expo-location';
import type { LocationObject } from 'expo-location';
import {
   clearDeviceLocationCache,
   getCachedDeviceLocation,
   isLocationCacheFresh,
   useDeviceLocationStore,
   type DeviceLocationReading,
} from '@/store/deviceLocation';
import { updateAuthUserProfile } from './authProfile';
import type { ProfileLocationPayload } from './profileTypes';

const LOCATION_PERMISSION_MESSAGE =
   'AudioBook uses your location to personalize your experience and improve our service.';

export type { DeviceLocationReading } from '@/store/deviceLocation';
export { clearDeviceLocationCache };

type LocationFetchFailureReason =
   | 'permission_denied'
   | 'services_disabled'
   | 'position_unavailable';

let lastLoggedFailure: LocationFetchFailureReason | null = null;
let memoryFetchInFlight: Promise<DeviceLocationReading | null> | null = null;
let locationSyncInFlight: Promise<void> | null = null;

function mapPositionToDeviceLocation(position: LocationObject): DeviceLocationReading {
   return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      altitude: position.coords.altitude ?? null,
      timestamp: new Date(position.timestamp).toISOString(),
   };
}

function toProfileLocationPayload(
   location: DeviceLocationReading
): ProfileLocationPayload {
   return {
      latitude: String(location.latitude),
      longitude: String(location.longitude),
   };
}

function logLocationFailureOnce(
   reason: LocationFetchFailureReason,
   detail?: unknown
): void {
   if (lastLoggedFailure === reason) {
      return;
   }
   lastLoggedFailure = reason;

   switch (reason) {
      case 'permission_denied':
         console.warn(
            '[Location] Foreground location permission was denied. Grant location access in Settings to personalize your experience.'
         );
         break;
      case 'services_disabled':
         console.warn(
            '[Location] Location services are turned off on this device. Enable Location in system settings to sync your profile.'
         );
         break;
      case 'position_unavailable':
         console.warn('[Location] Unable to read current position:', detail);
         break;
   }
}

function clearLocationFailureLog(): void {
   lastLoggedFailure = null;
}

/**
 * Requests while-in-use location permission (sufficient for profile sync on login).
 * @returns true when foreground access is granted
 */
export async function requestLocationPermissions(): Promise<boolean> {
   const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

   if (existingStatus === Location.PermissionStatus.GRANTED) {
      return true;
   }

   const { status } = await Location.requestForegroundPermissionsAsync();
   return status === Location.PermissionStatus.GRANTED;
}

/**
 * Returns whether location services are enabled on the device.
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
   return Location.hasServicesEnabledAsync();
}

/**
 * Fetches the device's current coordinates (requests permission if needed).
 * On physical devices we request permission first, then attempt GPS rather than
 * bailing early on the services check (which can be stale before permission is granted).
 */
export async function getCurrentDeviceLocation(): Promise<DeviceLocationReading | null> {
   const granted = await requestLocationPermissions();
   if (!granted) {
      logLocationFailureOnce('permission_denied');
      return null;
   }

   try {
      const position = await Location.getCurrentPositionAsync({
         accuracy: Location.Accuracy.Balanced,
      });
      clearLocationFailureLog();
      return mapPositionToDeviceLocation(position);
   } catch (error) {
      const servicesEnabled = await isLocationServicesEnabled();
      if (!servicesEnabled) {
         logLocationFailureOnce('services_disabled');
      } else {
         logLocationFailureOnce('position_unavailable', error);
      }
      return null;
   }
}

/**
 * Fetches GPS and stores coordinates in memory (no API call).
 * Safe to call multiple times — concurrent calls share one in-flight request.
 */
export async function fetchDeviceLocationInMemory(): Promise<DeviceLocationReading | null> {
   if (memoryFetchInFlight) {
      return memoryFetchInFlight;
   }

   memoryFetchInFlight = (async () => {
      useDeviceLocationStore.getState().setFetching(true);

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
         logLocationFailureOnce('position_unavailable', error);
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
         let location: DeviceLocationReading | null = null;

         if (!forceRefresh && isLocationCacheFresh()) {
            location = getCachedDeviceLocation();
         }

         if (!location) {
            location = await fetchDeviceLocationInMemory();
         }

         if (!location) {
            return;
         }

         await updateAuthUserProfile({ location: toProfileLocationPayload(location) });
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
