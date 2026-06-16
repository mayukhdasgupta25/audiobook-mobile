import { ApiError } from '@/services/api';
import { checkAndHandle401Error } from '@/utils/apiErrorHandler';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { showToast } from '@/utils/toast';

interface QueryMeta {
   silent?: boolean;
   silent404?: boolean;
}

function isSilentError(meta: unknown): boolean {
   if (!meta || typeof meta !== 'object') {
      return false;
   }
   return Boolean((meta as QueryMeta).silent);
}

function isSilent404(meta: unknown, error: unknown): boolean {
   if (!isNotFoundError(error)) {
      return false;
   }
   if (!meta || typeof meta !== 'object') {
      return true;
   }
   const typedMeta = meta as QueryMeta;
   return typedMeta.silent404 !== false;
}

export async function handleGlobalQueryError(
   error: unknown,
   meta?: unknown
): Promise<void> {
   if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 401) {
      const apiError = error instanceof ApiError
         ? error
         : new ApiError(401, 'Unauthorized', error);
      await checkAndHandle401Error(apiError, false);
      return;
   }

   if (isSilentError(meta) || isSilent404(meta, error)) {
      return;
   }

   showToast({
      message: getApiErrorMessage(error),
      type: 'error',
   });
}

export async function handleGlobalMutationError(error: unknown): Promise<void> {
   if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 401) {
      const apiError = error instanceof ApiError
         ? error
         : new ApiError(401, 'Unauthorized', error);
      await checkAndHandle401Error(apiError, false);
   }
}
