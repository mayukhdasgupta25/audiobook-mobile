import { ApiError } from '@/services/api';

export function isNotFoundError(error: unknown): boolean {
   return error instanceof ApiError && error.status === 404;
}
