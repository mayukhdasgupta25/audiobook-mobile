/**
 * Centralized API error handler for 401 (Unauthorized) errors
 * Handles token expiration and redirects to signin
 */

import { ApiError } from '@/services/api';
import { logout } from '@/utils/logout';

/**
 * Flag to prevent multiple simultaneous 401 handlers
 */
let isHandling401 = false;

/**
 * Handle 401 (Unauthorized) error
 * Clears authentication state and redirects to signin page
 * @param error - The API error (must be ApiError with status 401)
 * @param skipRedirect - If true, only clears auth without redirecting (useful for login/signup)
 */
export async function handle401Error(error: ApiError, skipRedirect = false): Promise<void> {
   // Prevent multiple simultaneous 401 handlers
   if (isHandling401) {
      return;
   }

   if (error.status !== 401) {
      return;
   }

   isHandling401 = true;

   try {
      // Clear all reducers and redirect to signin
      // Note: If logout API fails, state won't be cleared per requirements
      await logout(skipRedirect);
   } catch (logoutError) {
      // Log error but continue - logout API failure means state wasn't cleared
      console.error('[API Error Handler] Logout failed during 401 handling:', logoutError);
   }

   // Reset flag after a delay to allow re-handling if user logs in again
   setTimeout(() => {
      isHandling401 = false;
   }, 1000);
}

/**
 * Check if error is a 401 and handle it
 * @param error - Error to check
 * @param skipRedirect - If true, only clears auth without redirecting
 * @returns Promise<boolean> - true if error was a 401 and was handled, false otherwise
 */
export async function checkAndHandle401Error(
   error: unknown,
   skipRedirect = false
): Promise<boolean> {
   // Check if error is an ApiError with status 401
   if (error instanceof ApiError && error.status === 401) {
      await handle401Error(error, skipRedirect);
      return true;
   }

   // Also check for error objects with status property (for compatibility)
   if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: unknown }).status === 401
   ) {
      // Create an ApiError-like object for handling
      const apiError = new ApiError(
         401,
         'Unauthorized',
         error
      );
      await handle401Error(apiError, skipRedirect);
      return true;
   }

   return false;
}

