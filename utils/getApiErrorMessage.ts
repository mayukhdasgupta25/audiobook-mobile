import { ApiError } from '@/services/api';
import { getAuthApiErrorMessage } from '@/utils/authApiErrors';

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

function messageFromApiData(data: unknown): string | null {
   if (!data || typeof data !== 'object') {
      return null;
   }

   const record = data as { message?: string; error?: string };

   if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message.trim();
   }

   if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error.trim();
   }

   return null;
}

/**
 * Extracts a user-facing message from API or generic errors.
 */
export function getApiErrorMessage(
   error: unknown,
   fallback: string = DEFAULT_FALLBACK
): string {
   if (error instanceof ApiError) {
      return (
         getAuthApiErrorMessage(error.data) ??
         messageFromApiData(error.data) ??
         fallback
      );
   }

   if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
   }

   return fallback;
}

export { DEFAULT_FALLBACK as DEFAULT_API_ERROR_MESSAGE };
