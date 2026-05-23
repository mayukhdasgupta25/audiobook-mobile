/**
 * Android 13+ requires POST_NOTIFICATIONS at runtime for the media playback
 * notification (lock screen and notification shade controls).
 */

import { Platform, PermissionsAndroid } from 'react-native';

const ANDROID_API_TIRAMISU = 33;

export async function ensureMediaNotificationPermission(): Promise<boolean> {
   if (Platform.OS !== 'android' || Platform.Version < ANDROID_API_TIRAMISU) {
      return true;
   }

   const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
   const alreadyGranted = await PermissionsAndroid.check(permission);
   if (alreadyGranted) {
      return true;
   }

   const result = await PermissionsAndroid.request(permission, {
      title: 'Playback controls',
      message:
         'Allow notifications so you can control audiobook playback from the lock screen and notification panel.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
   });

   return result === PermissionsAndroid.RESULTS.GRANTED;
}
