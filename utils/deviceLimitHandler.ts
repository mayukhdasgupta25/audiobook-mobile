/**
 * Handles device limit exceeded errors during auth by redirecting to device management.
 */

import { router } from 'expo-router';
import {
   getAuthApiErrorMessage,
   getDeviceLimitDetails,
} from '@/utils/authApiErrors';
import { useDeviceLimitStore } from '@/store/deviceLimit';

let isHandlingDeviceLimit = false;

/**
 * Stores device-limit context and navigates to the manage-devices screen.
 */
export function handleDeviceLimitExceeded(errorData: unknown): void {
   if (isHandlingDeviceLimit) {
      return;
   }

   isHandlingDeviceLimit = true;

   const message =
      getAuthApiErrorMessage(errorData) ??
      'Device limit reached for your subscription plan';
   const details = getDeviceLimitDetails(errorData);

   useDeviceLimitStore.getState().setContext({
      message,
      maxDevices: details?.maxDevices ?? null,
      registeredDevices: details?.registeredDevices ?? [],
   });

   router.replace('/manage-devices');

   setTimeout(() => {
      isHandlingDeviceLimit = false;
   }, 1000);
}
