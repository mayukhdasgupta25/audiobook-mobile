/**
 * Syncs cached or fresh device location to the user profile for restored sessions.
 * Fresh login/signup flows trigger sync explicitly in their screens.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { syncUserLocationToProfile } from '@/services/location';

/**
 * When the user is already authenticated on app launch, sync location to profile once.
 * Does not block navigation or UI.
 */
export function useUserLocationSync(): void {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const accessToken = useSelector((state: RootState) => state.auth.accessToken);

   const hasSyncedForSessionRef = useRef(false);

   useEffect(() => {
      if (!isInitialized || !isAuthenticated || !accessToken) {
         if (!isAuthenticated) {
            hasSyncedForSessionRef.current = false;
         }
         return;
      }

      if (hasSyncedForSessionRef.current) {
         return;
      }

      hasSyncedForSessionRef.current = true;

      void syncUserLocationToProfile();
   }, [isAuthenticated, isInitialized, accessToken]);
}
