/**
 * Initialize Track Player when the app shell mounts; refresh jump intervals when setting changes.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Platform } from 'react-native';
import { RootState } from '@/store';
import { setupPlaybackServiceHandlers } from '@/services/playbackServiceHandlers';
import {
   setupTrackPlayerOnce,
   updateTrackPlayerOptions,
   resetTrackPlayerSetup,
} from '@/services/trackPlayerSetup';

export { setupTrackPlayerOnce, updateTrackPlayerOptions } from '@/services/trackPlayerSetup';

async function setupTrackPlayerWithHandlers(): Promise<void> {
   await setupTrackPlayerOnce();

   // Android headless task does not receive DeviceEventEmitter; register in main JS.
   if (Platform.OS === 'android') {
      setupPlaybackServiceHandlers();
   }
}

/**
 * Initialize Track Player when the app shell mounts; refresh jump intervals when setting changes.
 */
export function useTrackPlayerSetup(): void {
   const skipDurationSeconds = useSelector(
      (state: RootState) => state.settings.skipDurationSeconds
   );
   const playbackSpeed = useSelector((state: RootState) => state.settings.playbackSpeed);
   const didRun = useRef(false);

   useEffect(() => {
      if (!didRun.current) {
         didRun.current = true;
         setupTrackPlayerWithHandlers()
            .then(() => updateTrackPlayerOptions(skipDurationSeconds, playbackSpeed))
            .catch((error: unknown) => {
               console.error('[TrackPlayer] Setup failed:', error);
               resetTrackPlayerSetup();
            });
         return;
      }

      updateTrackPlayerOptions(skipDurationSeconds, playbackSpeed).catch((error: unknown) => {
         console.error('[TrackPlayer] Failed to update options:', error);
      });
   }, [skipDurationSeconds, playbackSpeed]);
}
