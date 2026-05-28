/**
 * Device location — permissions, current position, and profile sync.
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { updateUserProfile, type UserLocation } from './user';

const LOCATION_PERMISSION_MESSAGE =
   'AudioBook uses your location to personalize your experience and improve our service.';

/**
 * Location payload sent with PUT /user/profile
 */
export type { UserLocation } from './user';

/**
 * Requests foreground location permission, then background on Android when applicable.
 * @returns true when at least foreground access is granted
 */
export async function requestLocationPermissions(): Promise<boolean> {
   const foreground = await Location.requestForegroundPermissionsAsync();
   if (foreground.status !== Location.PermissionStatus.GRANTED) {
      return false;
   }

   if (Platform.OS === 'android') {
      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status !== Location.PermissionStatus.GRANTED) {
         console.warn(
            '[Location] Background location not granted; will sync when app is in use.'
         );
      }
   }

   if (Platform.OS === 'ios') {
      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status !== Location.PermissionStatus.GRANTED) {
         console.warn(
            '[Location] Always-on location not granted; will sync when app is in use.'
         );
      }
   }

   return true;
}

/**
 * Returns whether location services are enabled on the device.
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
   return Location.hasServicesEnabledAsync();
}

/**
 * Fetches the device's current coordinates (requests permission if needed).
 * Runs without blocking the UI — call from a fire-and-forget task.
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

let locationSyncInFlight: Promise<void> | null = null;

/**
 * Fetches current location and updates the user profile via API.
 * Safe to call multiple times — concurrent calls share one in-flight request.
 */
export async function syncUserLocationToProfile(): Promise<void> {
   if (locationSyncInFlight) {
      return locationSyncInFlight;
   }

   locationSyncInFlight = (async () => {
      try {
         const location = await getCurrentDeviceLocation();
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
