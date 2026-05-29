/**
 * Auth API error response helpers
 * Auth service errors use an `error` string (e.g. DEVICE_LIMIT_EXCEEDED).
 */

export const DEVICE_LIMIT_EXCEEDED_CODE = 'DEVICE_LIMIT_EXCEEDED';

export interface RegisteredDevice {
   id: string;
   deviceId: string;
   deviceName: string;
   platform: string;
   lastSeenAt: string;
   createdAt: string;
}

export interface DeviceLimitDetails {
   maxDevices: number;
   registeredDevices: RegisteredDevice[];
}

export interface AuthApiErrorData {
   error?: string;
   message?: string;
   code?: string;
   details?: DeviceLimitDetails;
}

/**
 * Extracts a user-facing message from auth API error payloads.
 */
export function getAuthApiErrorMessage(data: unknown): string | null {
   if (!data || typeof data !== 'object') {
      return null;
   }

   const record = data as AuthApiErrorData;

   if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error.trim();
   }

   if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message.trim();
   }

   return null;
}

export function isDeviceLimitExceededError(data: unknown): boolean {
   if (!data || typeof data !== 'object') {
      return false;
   }

   return (data as AuthApiErrorData).code === DEVICE_LIMIT_EXCEEDED_CODE;
}

export function getDeviceLimitDetails(data: unknown): DeviceLimitDetails | null {
   if (!data || typeof data !== 'object') {
      return null;
   }

   const details = (data as AuthApiErrorData).details;
   if (!details || typeof details !== 'object') {
      return null;
   }

   const maxDevices =
      typeof details.maxDevices === 'number' ? details.maxDevices : undefined;
   const registeredDevices = Array.isArray(details.registeredDevices)
      ? details.registeredDevices
      : undefined;

   if (maxDevices === undefined && !registeredDevices) {
      return null;
   }

   return {
      maxDevices: maxDevices ?? 0,
      registeredDevices: registeredDevices ?? [],
   };
}
