/**
 * Syncs device location to the user profile in the background after authentication.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { syncUserLocationToProfile } from '@/services/location';

/**
 * When the user is authenticated, requests location permission and updates profile.
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
