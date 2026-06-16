import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { showToast } from '@/utils/toast';

/**
 * Navigates away when a detail resource is missing (deleted or 404).
 */
export function useNotFoundRedirect(
   isNotFound: boolean,
   message = 'This content is no longer available.'
): void {
   const redirectedRef = useRef(false);

   useEffect(() => {
      if (!isNotFound || redirectedRef.current) {
         return;
      }

      redirectedRef.current = true;
      showToast({ message, type: 'info' });

      if (router.canGoBack()) {
         router.back();
         return;
      }

      router.replace('/(tabs)');
   }, [isNotFound, message]);
}
