/**
 * Playback Sync Hook
 * Manages automatic playback state syncing every 5 seconds during playback
 */

import { useEffect, useRef } from 'react';
import { syncPlayback } from '@/services/audiobooks';
import { queryKeys } from '@/constants/queryKeys';
import { store } from '@/store';

interface UsePlaybackSyncParams {
   audiobookId: string | null;
   chapterId: string | null;
   playbackPosition: number;
   totalDuration: number;
   isPlaying: boolean;
   isActive: boolean; // Whether the audio player is active/visible
}

async function invalidatePlaybackQueries(
   audiobookId: string,
   chapterId: string
): Promise<void> {
   const { queryClient } = await import('@/utils/queryClient');
   const userProfileId = store.getState().auth.userProfile?.id;

   void queryClient.invalidateQueries({
      queryKey: queryKeys.playback.chapterProgress(chapterId),
   });
   void queryClient.invalidateQueries({
      queryKey: queryKeys.playback.continueListening(audiobookId),
   });
   void queryClient.invalidateQueries({
      queryKey: queryKeys.userAudiobooks.me(),
   });

   if (userProfileId) {
      void queryClient.invalidateQueries({
         queryKey: queryKeys.playback.listeningHistory(userProfileId),
      });
   }
}

/**
 * Hook to automatically sync playback state every 5 seconds during playback
 */
export function usePlaybackSync({
   audiobookId,
   chapterId,
   playbackPosition,
   totalDuration,
   isPlaying,
   isActive,
}: UsePlaybackSyncParams): void {
   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const initialSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const lastSyncedPositionRef = useRef<number>(0);
   const playbackPositionRef = useRef<number>(playbackPosition);
   const totalDurationRef = useRef<number>(totalDuration);
   const audiobookIdRef = useRef<string | null>(audiobookId);
   const chapterIdRef = useRef<string | null>(chapterId);
   const isPlayingRef = useRef<boolean>(isPlaying);
   const isActiveRef = useRef<boolean>(isActive);
   const wasPlayingRef = useRef<boolean>(isPlaying);

   useEffect(() => {
      playbackPositionRef.current = playbackPosition;
      totalDurationRef.current = totalDuration;
      audiobookIdRef.current = audiobookId;
      chapterIdRef.current = chapterId;
      isPlayingRef.current = isPlaying;
      isActiveRef.current = isActive;
   }, [playbackPosition, totalDuration, audiobookId, chapterId, isPlaying, isActive]);

   useEffect(() => {
      const wasPlaying = wasPlayingRef.current;
      const isResuming = !wasPlaying && isPlaying;

      wasPlayingRef.current = isPlaying;

      if (isPlaying && isActive && audiobookId && chapterId) {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }

         if (isResuming) {
            if (initialSyncTimeoutRef.current) {
               clearTimeout(initialSyncTimeoutRef.current);
               initialSyncTimeoutRef.current = null;
            }

            initialSyncTimeoutRef.current = setTimeout(() => {
               if (
                  isPlayingRef.current &&
                  isActiveRef.current &&
                  audiobookIdRef.current &&
                  chapterIdRef.current
               ) {
                  syncPlayback({
                     audiobookId: audiobookIdRef.current,
                     chapterId: chapterIdRef.current,
                     action: 'play',
                     position: playbackPositionRef.current,
                     durationSeconds:
                        totalDurationRef.current > 0
                           ? totalDurationRef.current
                           : undefined,
                  })
                     .then(() =>
                        invalidatePlaybackQueries(
                           audiobookIdRef.current!,
                           chapterIdRef.current!
                        )
                     )
                     .catch((error: unknown) => {
                        console.error(
                           '[Playback Sync Hook] Failed to sync playback on start/resume:',
                           error
                        );
                     });
                  lastSyncedPositionRef.current = playbackPositionRef.current;
               }
            }, 1000);
         }

         if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
               const currentAudiobookId = audiobookIdRef.current;
               const currentChapterId = chapterIdRef.current;
               const currentPosition = playbackPositionRef.current;
               const currentlyPlaying = isPlayingRef.current;
               const currentlyActive = isActiveRef.current;

               if (
                  currentlyPlaying &&
                  currentlyActive &&
                  currentAudiobookId &&
                  currentChapterId
               ) {
                  syncPlayback({
                     audiobookId: currentAudiobookId,
                     chapterId: currentChapterId,
                     action: 'seek',
                     position: currentPosition,
                     durationSeconds:
                        totalDurationRef.current > 0
                           ? totalDurationRef.current
                           : undefined,
                  })
                     .then(() =>
                        invalidatePlaybackQueries(currentAudiobookId, currentChapterId)
                     )
                     .catch((error: unknown) => {
                        console.error('[Playback Sync Hook] Failed to sync playback:', error);
                     });
                  lastSyncedPositionRef.current = currentPosition;
               }
            }, 5000);
         }

         return () => {
            if (intervalRef.current) {
               clearInterval(intervalRef.current);
               intervalRef.current = null;
            }
            if (initialSyncTimeoutRef.current) {
               clearTimeout(initialSyncTimeoutRef.current);
               initialSyncTimeoutRef.current = null;
            }
         };
      } else {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
         if (initialSyncTimeoutRef.current) {
            clearTimeout(initialSyncTimeoutRef.current);
            initialSyncTimeoutRef.current = null;
         }
         if (!isPlaying || !isActive) {
            lastSyncedPositionRef.current = 0;
         }
         return undefined;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isPlaying, isActive, audiobookId, chapterId]);
}
