/**
 * Playback Sync Hook
 * Manages automatic playback state syncing every 5 seconds during playback
 */

import { useEffect, useRef } from 'react';
import { syncPlayback } from '@/services/audiobooks';

interface UsePlaybackSyncParams {
   audiobookId: string | null;
   chapterId: string | null;
   playbackPosition: number;
   isPlaying: boolean;
   isActive: boolean; // Whether the audio player is active/visible
}

/**
 * Hook to automatically sync playback state every 5 seconds during playback
 * @param audiobookId - Current audiobook ID
 * @param chapterId - Current chapter ID
 * @param playbackPosition - Current playback position in seconds
 * @param isPlaying - Whether playback is currently active
 * @param isActive - Whether the audio player is active/visible
 */
export function usePlaybackSync({
   audiobookId,
   chapterId,
   playbackPosition,
   isPlaying,
   isActive,
}: UsePlaybackSyncParams): void {
   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const initialSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const lastSyncedPositionRef = useRef<number>(0);
   const playbackPositionRef = useRef<number>(playbackPosition);
   const audiobookIdRef = useRef<string | null>(audiobookId);
   const chapterIdRef = useRef<string | null>(chapterId);
   const isPlayingRef = useRef<boolean>(isPlaying);
   const isActiveRef = useRef<boolean>(isActive);
   const wasPlayingRef = useRef<boolean>(isPlaying); // Track previous playing state

   // Update refs when values change
   useEffect(() => {
      playbackPositionRef.current = playbackPosition;
      audiobookIdRef.current = audiobookId;
      chapterIdRef.current = chapterId;
      isPlayingRef.current = isPlaying;
      isActiveRef.current = isActive;
   }, [playbackPosition, audiobookId, chapterId, isPlaying, isActive]);

   useEffect(() => {
      // Detect transition from paused to playing (resume) or initial start
      const wasPlaying = wasPlayingRef.current;
      const isResuming = !wasPlaying && isPlaying;

      // Update previous playing state AFTER checking transition
      wasPlayingRef.current = isPlaying;

      // Only sync when playing, active, and we have all required data
      if (isPlaying && isActive && audiobookId && chapterId) {
         // Clear any existing interval
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }

         // Only set up the 1-second timeout when transitioning from paused to playing (resume) or initial start
         // This ensures "play" action is called 1 second after starting/resuming
         if (isResuming) {
            // Clear any existing timeout before setting a new one
            if (initialSyncTimeoutRef.current) {
               clearTimeout(initialSyncTimeoutRef.current);
               initialSyncTimeoutRef.current = null;
            }

            // Sync 1 second after playback starts OR when resuming from pause
            // This covers both initial play and resume scenarios
            initialSyncTimeoutRef.current = setTimeout(() => {
               // Double-check that we're still playing and active before syncing
               if (isPlayingRef.current && isActiveRef.current && audiobookIdRef.current && chapterIdRef.current) {
                  syncPlayback({
                     audiobookId: audiobookIdRef.current,
                     chapterId: chapterIdRef.current,
                     action: 'play', // Use "play" action for initial start or resume
                     position: playbackPositionRef.current,
                  }).catch((error: unknown) => {
                     console.error('[Playback Sync Hook] Failed to sync playback on start/resume:', error);
                  });
                  lastSyncedPositionRef.current = playbackPositionRef.current;
               }
            }, 1000); // 1 second delay
         }

         // Set up interval to sync every 5 seconds with "seek" action
         // This runs continuously while playing (only if interval doesn't already exist)
         if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
               const currentAudiobookId = audiobookIdRef.current;
               const currentChapterId = chapterIdRef.current;
               const currentPosition = playbackPositionRef.current;
               const currentlyPlaying = isPlayingRef.current;
               const currentlyActive = isActiveRef.current;

               // Only sync if still playing and active
               if (currentlyPlaying && currentlyActive && currentAudiobookId && currentChapterId) {
                  syncPlayback({
                     audiobookId: currentAudiobookId,
                     chapterId: currentChapterId,
                     action: 'seek', // Use "seek" action for periodic syncs during playback
                     position: currentPosition,
                  }).catch((error: unknown) => {
                     console.error('[Playback Sync Hook] Failed to sync playback:', error);
                  });
                  lastSyncedPositionRef.current = currentPosition;
               }
            }, 5000); // 5 seconds
         }

         // Cleanup interval and timeout on unmount or when playback stops
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
         // Clear interval and timeout when not playing or not active
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
         if (initialSyncTimeoutRef.current) {
            clearTimeout(initialSyncTimeoutRef.current);
            initialSyncTimeoutRef.current = null;
         }
         // Reset last synced position when playback stops
         if (!isPlaying || !isActive) {
            lastSyncedPositionRef.current = 0;
         }
         // Return undefined cleanup function for consistency
         return undefined;
      }
      // Remove playbackPosition from dependencies - it causes unnecessary re-runs
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isPlaying, isActive, audiobookId, chapterId]);
}

