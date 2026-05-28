/**
 * Device identification service
 * Collects device metadata and persists it in SecureStore for auth flows.
 */

import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const DEVICE_DETAILS_KEY = 'device_details';

export type DevicePlatform = typeof Platform.OS;

export interface DeviceDetails {
   deviceId: string;
   deviceName: string;
   platform: DevicePlatform;
}

function generateDeviceId(): string {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
   }

   // Fallback for environments without crypto.randomUUID
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
   });
}

function resolveDeviceName(): string {
   if (Device.deviceName) {
      return Device.deviceName;
   }
   if (Device.modelName) {
      return Device.modelName;
   }
   return `Unknown ${Platform.OS} device`;
}

function isValidDeviceDetails(value: unknown): value is DeviceDetails {
   if (!value || typeof value !== 'object') {
      return false;
   }
   const record = value as Record<string, unknown>;
   return (
      typeof record.deviceId === 'string' &&
      record.deviceId.length > 0 &&
      typeof record.deviceName === 'string' &&
      typeof record.platform === 'string'
   );
}

/**
 * Reads persisted device details from SecureStore.
 */
export async function getStoredDeviceDetails(): Promise<DeviceDetails | null> {
   try {
      const json = await SecureStore.getItemAsync(DEVICE_DETAILS_KEY);
      if (!json) {
         return null;
      }
      const parsed: unknown = JSON.parse(json);
      return isValidDeviceDetails(parsed) ? parsed : null;
   } catch (error) {
      console.error('[Device] Error reading stored device details:', error);
      return null;
   }
}

/**
 * Fetches current device metadata, reuses an existing device UUID when present,
 * and persists the result in SecureStore.
 */
export async function fetchAndStoreDeviceDetails(): Promise<DeviceDetails> {
   const existing = await getStoredDeviceDetails();

   const details: DeviceDetails = {
      deviceId: existing?.deviceId ?? generateDeviceId(),
      deviceName: resolveDeviceName(),
      platform: Platform.OS,
   };

   try {
      await SecureStore.setItemAsync(DEVICE_DETAILS_KEY, JSON.stringify(details));
   } catch (error) {
      console.error('[Device] Error saving device details to SecureStore:', error);
      throw error;
   }

   return details;
}
