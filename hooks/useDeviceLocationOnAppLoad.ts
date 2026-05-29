/**
 * Fetches device location into memory once per app launch (no API sync).
 */

import { useEffect, useRef } from 'react';
import { fetchDeviceLocationInMemory } from '@/services/location';

/**
 * @param isAppReady - When true, app initialization is complete enough to request location.
 */
export function useDeviceLocationOnAppLoad(isAppReady: boolean): void {
   const hasFetchedRef = useRef(false);

   useEffect(() => {
      if (!isAppReady || hasFetchedRef.current) {
         return;
      }

      hasFetchedRef.current = true;
      void fetchDeviceLocationInMemory();
   }, [isAppReady]);
}
