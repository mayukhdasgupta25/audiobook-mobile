/**
 * Handles RNTP notification content-intent URLs when the app is already running.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { handlePlaybackNotificationUrl } from '@/utils/playbackNotificationNavigation';

export function usePlaybackNotificationLinking(enabled: boolean): void {
   const pathname = usePathname();
   const pathnameRef = useRef(pathname);
   const handledInitialRef = useRef(false);

   useEffect(() => {
      pathnameRef.current = pathname;
   }, [pathname]);

   useEffect(() => {
      if (!enabled) {
         return;
      }

      const onUrl = (event: { url: string }) => {
         void handlePlaybackNotificationUrl(event.url, pathnameRef.current);
      };

      const subscription = Linking.addEventListener('url', onUrl);

      if (!handledInitialRef.current) {
         handledInitialRef.current = true;
         void Linking.getInitialURL().then((url) =>
            handlePlaybackNotificationUrl(url, pathnameRef.current)
         );
      }

      return () => subscription.remove();
   }, [enabled]);
}
