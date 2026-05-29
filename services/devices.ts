/**
 * Auth device management API (subscription device limits)
 */

import { get, post, del, ApiError } from './api';
import type { RegisteredDevice } from '@/utils/authApiErrors';

export interface RequestDeviceRemovalOtpPayload {
   email: string;
   deviceId: string;
}

export interface ConfirmDeviceRemovalPayload {
   recordId: string;
   email: string;
   otp: string;
}

function resolveAuthFlags(): { useAuth: boolean; useAuthApi: true } {
   // eslint-disable-next-line @typescript-eslint/no-require-imports
   const { store } = require('@/store');
   const accessToken = store.getState().auth?.accessToken;
   return { useAuth: !!accessToken, useAuthApi: true };
}

function isRegisteredDevice(value: unknown): value is RegisteredDevice {
   if (!value || typeof value !== 'object') {
      return false;
   }

   const record = value as Record<string, unknown>;
   return (
      typeof record.id === 'string' &&
      typeof record.deviceName === 'string' &&
      typeof record.platform === 'string'
   );
}

function parseDevicesResponse(data: unknown): RegisteredDevice[] {
   if (Array.isArray(data)) {
      return data.filter(isRegisteredDevice);
   }

   if (!data || typeof data !== 'object') {
      return [];
   }

   const record = data as Record<string, unknown>;

   if (Array.isArray(record.devices)) {
      return record.devices.filter(isRegisteredDevice);
   }

   if (record.data && typeof record.data === 'object') {
      const inner = record.data as Record<string, unknown>;
      if (Array.isArray(inner.devices)) {
         return inner.devices.filter(isRegisteredDevice);
      }
      if (Array.isArray(inner)) {
         return inner.filter(isRegisteredDevice);
      }
   }

   if (Array.isArray(record.data)) {
      return record.data.filter(isRegisteredDevice);
   }

   return [];
}

/**
 * GET /auth/devices — list devices registered to the account (authenticated fallback).
 */
export async function getAuthDevices(): Promise<RegisteredDevice[]> {
   try {
      const { useAuth, useAuthApi } = resolveAuthFlags();
      const response = await get<unknown>('/auth/devices', useAuth, useAuthApi);
      return parseDevicesResponse(response.data);
   } catch (error) {
      console.error('[Devices Service] Get devices error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Get devices failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * POST /auth/devices/request-removal-otp — send OTP to verify device removal.
 */
export async function requestDeviceRemovalOtp(
   payload: RequestDeviceRemovalOtpPayload
): Promise<void> {
   try {
      await post<unknown>(
         '/auth/devices/request-removal-otp',
         payload,
         false,
         true
      );
   } catch (error) {
      console.error('[Devices Service] Request removal OTP error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Request removal OTP failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * POST /auth/devices/resend-removal-otp — resend OTP (same body as request-removal-otp).
 */
export async function resendDeviceRemovalOtp(
   payload: RequestDeviceRemovalOtpPayload
): Promise<void> {
   try {
      await post<unknown>(
         '/auth/devices/resend-removal-otp',
         payload,
         false,
         true
      );
   } catch (error) {
      console.error('[Devices Service] Resend removal OTP error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Resend removal OTP failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * DELETE /auth/devices/:id — confirm device removal with email and OTP.
 */
export async function confirmDeviceRemoval(
   payload: ConfirmDeviceRemovalPayload
): Promise<void> {
   const { recordId, email, otp } = payload;

   try {
      await del<unknown>(
         `/auth/devices/${recordId}`,
         false,
         true,
         false,
         { email, otp }
      );
   } catch (error) {
      console.error('[Devices Service] Confirm device removal error', {
         error,
         recordId,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Confirm device removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
