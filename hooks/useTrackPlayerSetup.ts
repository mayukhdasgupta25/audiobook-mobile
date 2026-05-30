/**
 * One-time React Native Track Player setup and capability options.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import TrackPlayer, {
   AppKilledPlaybackBehavior,
   Capability,
   RatingType,
} from 'react-native-track-player';
import { Platform } from 'react-native';
import { RootState } from '@/store';
import { ensureMediaNotificationPermission } from '@/utils/ensureMediaNotificationPermission';
import { setupPlaybackServiceHandlers } from '@/services/playbackServiceHandlers';
import {
   DEFAULT_PLAYBACK_SPEED,
   formatPlaybackSpeedLabel,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';

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

export async function updateTrackPlayerOptions(
   skipDurationSeconds: number,
   playbackSpeed: PlaybackSpeed = DEFAULT_PLAYBACK_SPEED
): Promise<void> {
   await setupTrackPlayerOnce();

   const speedLabel = formatPlaybackSpeedLabel(playbackSpeed);

   const baseCapabilities = [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
   ];

   const androidCapabilities = [...baseCapabilities, Capability.SetRating];

   await TrackPlayer.updateOptions({
      capabilities: Platform.OS === 'android' ? androidCapabilities : baseCapabilities,
      notificationCapabilities:
         Platform.OS === 'android' ? androidCapabilities : baseCapabilities,
      compactCapabilities: [
         Capability.Play,
         Capability.JumpForward,
         Capability.JumpBackward,
      ],
      forwardJumpInterval: skipDurationSeconds,
      backwardJumpInterval: skipDurationSeconds,
      progressUpdateEventInterval: 1,
      ratingType: Platform.OS === 'android' ? RatingType.Heart : undefined,
      likeOptions: {
         title: speedLabel,
         isActive: playbackSpeed !== 1,
      },
      dislikeOptions: {
         title: 'Slower',
         isActive: false,
      },
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
   const playbackSpeed = useSelector((state: RootState) => state.settings.playbackSpeed);
   const didRun = useRef(false);

   useEffect(() => {
      if (!didRun.current) {
         didRun.current = true;
         setupTrackPlayerOnce()
            .then(() => updateTrackPlayerOptions(skipDurationSeconds, playbackSpeed))
            .catch((error: unknown) => {
               console.error('[TrackPlayer] Setup failed:', error);
               setupPromise = null;
            });
         return;
      }

      updateTrackPlayerOptions(skipDurationSeconds, playbackSpeed).catch((error: unknown) => {
         console.error('[TrackPlayer] Failed to update options:', error);
      });
   }, [skipDurationSeconds, playbackSpeed]);
}
