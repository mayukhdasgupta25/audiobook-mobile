/**
 * One-time React Native Track Player setup and capability options.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import TrackPlayer, {
   AppKilledPlaybackBehavior,
   Capability,
} from 'react-native-track-player';
import { Platform } from 'react-native';
import { RootState } from '@/store';
import { ensureMediaNotificationPermission } from '@/utils/ensureMediaNotificationPermission';
import { setupPlaybackServiceHandlers } from '@/services/playbackServiceHandlers';

let setupPromise: Promise<void> | null = null;

export async function setupTrackPlayerOnce(): Promise<void> {
   if (setupPromise) {
      if (Platform.OS === 'android') {
         setupPlaybackServiceHandlers();
      }
      return setupPromise;
   }

   setupPromise = (async () => {
      if (Platform.OS === 'android') {
         await ensureMediaNotificationPermission();
      }
      await TrackPlayer.setupPlayer({
         autoUpdateMetadata: true,
      });

      // Android headless task does not receive DeviceEventEmitter; register in main JS.
      if (Platform.OS === 'android') {
         setupPlaybackServiceHandlers();
      }
   })();
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
      // One Play entry maps to a single PLAY_PAUSE control (Play + Pause would duplicate it).
      notificationCapabilities: [
         Capability.Play,
         Capability.SeekTo,
         Capability.JumpForward,
         Capability.JumpBackward,
         Capability.SkipToNext,
         Capability.SkipToPrevious,
      ],
      compactCapabilities: [
         Capability.Play,
         Capability.JumpForward,
         Capability.JumpBackward,
      ],
      forwardJumpInterval: skipDurationSeconds,
      backwardJumpInterval: skipDurationSeconds,
      progressUpdateEventInterval: 1,
      android: {
         appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
         alwaysPauseOnInterruption: true,
         stopForegroundGracePeriod: 5,
      },
      ...(Platform.OS === 'android'
         ? {
              color: 0xffe53935,
           }
         : {}),
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
