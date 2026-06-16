import { ApiError } from '@/services/api';

/**
 * Shared TanStack Query retry policy — 401/404 are terminal (no refetch loops).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
   if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return false;
   }
   return failureCount < 2;
}
