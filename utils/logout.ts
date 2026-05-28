/**
 * Logout utility
 * Calls logout API and clears all Redux reducers and TanStack Query caches
 * Should be used whenever user logs out (manual logout or 401 error)
 * Only clears state if logout API returns 200 (success)
 */

import { store } from '@/store';
import { clearAuth, getStoredAuthProvider } from '@/store/auth';
import { clearAudiobooks } from '@/store/audiobooks';
import { stop, setVisible } from '@/store/player';
import { logout as logoutApi, revokeGoogleSignInSession } from '@/services/auth';
import { router } from 'expo-router';
import { queryClient } from '@/app/_layout';

/**
 * Logout function that calls API and clears all state
 * Only clears state and redirects if API returns 200 (success)
 * @param skipRedirect - If true, only clears state without redirecting (useful for login/signup)
 */
async function revokeGoogleSessionIfNeeded(authProvider: string | null): Promise<void> {
   if (authProvider === 'google') {
      await revokeGoogleSignInSession();
   }
}

export async function logout(skipRedirect = false): Promise<void> {
   const state = store.getState();
   const refreshToken = state.auth?.refreshToken;
   const authProvider =
      state.auth?.authProvider ?? (await getStoredAuthProvider());

   // If no refreshToken, cannot call logout API - still revoke Google if applicable
   if (!refreshToken) {
      console.warn('[Logout] No refresh token found, skipping logout API call');
      store.dispatch(stop());
      store.dispatch(setVisible(false));
      await revokeGoogleSessionIfNeeded(authProvider);
      return;
   }

   try {
      // Call logout API first
      // The post() function throws on non-200, so if we reach here, it was successful (200 status)
      await logoutApi(refreshToken);

      await revokeGoogleSessionIfNeeded(authProvider);

      // Only proceed with cleanup if API call was successful
      store.dispatch(stop());
      store.dispatch(setVisible(false));

      queryClient.clear();

      store.dispatch(clearAuth());
      store.dispatch(clearAudiobooks());

      // Redirect to signin (unless explicitly skipped, e.g., for login/signup endpoints)
      if (!skipRedirect) {
         router.replace('/signin');
      }
   } catch (error) {
      // If logout API fails, do NOT clear local state and do NOT redirect
      console.error('[Logout] Logout API call failed, state not cleared', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Re-throw error so caller can handle it if needed
      throw error;
   }
}

