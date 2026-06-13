/**
 * Monitors sleep timer expiry and pauses playback when the timer ends.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import TrackPlayer from 'react-native-track-player';
import { RootState, store } from '@/store';
import { pause } from '@/store/player';
import { clearSleepTimer } from '@/store/settings';
import { isWallClockSleepTimerExpired } from '@/utils/sleepTimer';
import { isActivePlaybackSession } from '@/utils/playbackSession';

async function pauseForSleepTimer(): Promise<void> {
   if (!isActivePlaybackSession()) {
      store.dispatch(clearSleepTimer());
      return;
   }
   store.dispatch(clearSleepTimer());
   store.dispatch(pause());
   try {
      await TrackPlayer.pause();
   } catch (error: unknown) {
      console.warn('[useSleepTimer] TrackPlayer.pause failed:', error);
   }
}

export function useSleepTimer(): void {
   const sleepTimerEndsAt = useSelector(
      (state: RootState) => state.settings.sleepTimerEndsAt
   );
   const sleepTimerOption = useSelector(
      (state: RootState) => state.settings.sleepTimerOption
   );
   const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

   useEffect(() => {
      if (intervalRef.current) {
         clearInterval(intervalRef.current);
         intervalRef.current = null;
      }

      if (sleepTimerOption === 'off' || sleepTimerOption === 'endOfChapter') {
         return;
      }

      if (sleepTimerEndsAt === null) {
         return;
      }

      const checkExpiry = () => {
         const settings = store.getState().settings;
         if (isWallClockSleepTimerExpired(settings.sleepTimerEndsAt)) {
            void pauseForSleepTimer();
         }
      };

      checkExpiry();
      intervalRef.current = setInterval(checkExpiry, 1000);

      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
      };
   }, [sleepTimerEndsAt, sleepTimerOption, isPlaying]);
}
