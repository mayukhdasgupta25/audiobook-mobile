/**
 * Fetches device location into memory once per app launch (no API sync).
 * Skipped for authenticated users — useUserLocationSync handles fetch + profile sync.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchDeviceLocationInMemory } from '@/services/location';

/**
 * @param isAppReady - When true, app initialization is complete enough to request location.
 */
export function useDeviceLocationOnAppLoad(isAppReady: boolean): void {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const hasFetchedRef = useRef(false);

   useEffect(() => {
      if (!isAppReady || !isInitialized || isAuthenticated || hasFetchedRef.current) {
         return;
      }

      hasFetchedRef.current = true;
      void fetchDeviceLocationInMemory();
   }, [isAppReady, isInitialized, isAuthenticated]);
}
