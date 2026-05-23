/**
 * One-time React Native Track Player setup and capability options.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { RootState } from '@/store';

let setupPromise: Promise<void> | null = null;

export async function setupTrackPlayerOnce(): Promise<void> {
   if (setupPromise) {
      return setupPromise;
   }

   setupPromise = TrackPlayer.setupPlayer().then(() => undefined);
   return setupPromise;
}

export async function updateTrackPlayerOptions(skipDurationSeconds: number): Promise<void> {
   await setupTrackPlayerOnce();
   await TrackPlayer.updateOptions({
      capabilities: [
         Capability.Play,
         Capability.Pause,
         Capability.SeekTo,
         Capability.JumpForward,
         Capability.JumpBackward,
         Capability.SkipToNext,
         Capability.SkipToPrevious,
      ],
      compactCapabilities: [
         Capability.Play,
         Capability.Pause,
         Capability.JumpForward,
         Capability.JumpBackward,
      ],
      forwardJumpInterval: skipDurationSeconds,
      backwardJumpInterval: skipDurationSeconds,
      progressUpdateEventInterval: 1,
   });
}

/**
 * Initialize Track Player when the app shell mounts; refresh jump intervals when setting changes.
 */
export function useTrackPlayerSetup(): void {
   const skipDurationSeconds = useSelector(
      (state: RootState) => state.settings.skipDurationSeconds
   );
   const didRun = useRef(false);

   useEffect(() => {
      if (!didRun.current) {
         didRun.current = true;
         setupTrackPlayerOnce()
            .then(() => updateTrackPlayerOptions(skipDurationSeconds))
            .catch((error: unknown) => {
               console.error('[TrackPlayer] Setup failed:', error);
               setupPromise = null;
            });
         return;
      }

      updateTrackPlayerOptions(skipDurationSeconds).catch((error: unknown) => {
         console.error('[TrackPlayer] Failed to update options:', error);
      });
   }, [skipDurationSeconds]);
}
