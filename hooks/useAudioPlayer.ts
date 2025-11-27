/**
 * Audio Player Hook
 * Manages audio playback using react-native-video with native HLS streaming
 */

import { useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OnProgressData, OnLoadData } from 'react-native-video';
import type { VideoRef } from 'react-native-video';
import { RootState } from '@/store';
import {
   stop,
   setPosition,
   setTotalDuration,
   setLoading,
   setError,
   seek,
} from '@/store/player';
import { getChapters, type Chapter } from '@/services/audiobooks';
import { setChapter, play } from '@/store/player';
import { STREAMING_API_BASE_URL, API_V1_STREAM_PATH } from '@/services/api';

/**
 * Hook to manage audio playback for chapters
 * Uses native HLS streaming via react-native-video
 */
export function useAudioPlayer() {
   const dispatch = useDispatch();
   const videoRef = useRef<VideoRef>(null);

   // Get player state from Redux
   const {
      isPlaying,
      currentChapterId,
   } = useSelector((state: RootState) => state.player);

   // Get access token from Redux
   const accessToken = useSelector((state: RootState) => state.auth.accessToken);

   // Construct playlist URL for current chapter
   // Both Android and iOS use master.m3u8
   const masterPlaylistUri = useMemo(() => {
      if (!currentChapterId) {
         return null;
      }
      const endpoint = `${API_V1_STREAM_PATH}/chapters/${currentChapterId}/master.m3u8`;
      return `${STREAMING_API_BASE_URL}${endpoint}`;
   }, [currentChapterId]);

   // Construct headers with Bearer token for HLS requests
   const headers = useMemo(() => {
      if (!accessToken) {
         return undefined;
      }
      return {
         Authorization: `Bearer ${accessToken}`,
      };
   }, [accessToken]);

   /**
    * Handle playback progress
    */
   const handleProgress = useCallback(
      (data: OnProgressData) => {
         // currentTime is absolute position from start of chapter
         dispatch(setPosition(data.currentTime));
      },
      [dispatch]
   );

   /**
    * Handle chapter end - auto-advance to next chapter if available
    */
   const handleEnd = useCallback(async () => {
      // Get fresh values from Redux to avoid stale closures
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const { store } = require('@/store');
      const state = store.getState();
      const freshChapterId = state.player.currentChapterId;
      const freshAudiobookId = state.player.audiobookId;

      // Reached end of chapter - try to auto-advance to next chapter
      if (freshAudiobookId) {
         try {
            // Fetch all chapters for the audiobook
            let allChapters: Chapter[] = [];
            let page = 1;
            let hasNextPage = true;

            while (hasNextPage) {
               const response = await getChapters(freshAudiobookId, page);
               allChapters.push(...response.data);

               if (response.pagination) {
                  hasNextPage = response.pagination.hasNextPage;
                  page++;
               } else {
                  hasNextPage = false;
               }

               // If we found the current chapter and next chapter, we can stop fetching
               const currentChapter = allChapters.find((c) => c.id === freshChapterId);
               if (currentChapter) {
                  const nextChapter = allChapters.find(
                     (c) => c.chapterNumber === currentChapter.chapterNumber + 1
                  );
                  if (nextChapter) {
                     // Found next chapter, stop fetching
                     hasNextPage = false;
                  }
               }
            }

            // Sort chapters by chapterNumber to ensure correct order
            allChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

            // Find current chapter
            const currentChapter = allChapters.find((c) => c.id === freshChapterId);

            if (currentChapter) {
               // Find next chapter by chapterNumber
               const nextChapter = allChapters.find(
                  (c) => c.chapterNumber === currentChapter.chapterNumber + 1
               );

               if (nextChapter) {
                  console.log('[Audio Player] Auto-advancing to next chapter', {
                     currentChapter: currentChapter.title,
                     nextChapter: nextChapter.title,
                  });

                  // Switch to next chapter - react-native-video will handle loading the new master.m3u8
                  dispatch(
                     setChapter({
                        chapterId: nextChapter.id,
                        metadata: {
                           id: nextChapter.id,
                           title: nextChapter.title,
                           coverImage: nextChapter.coverImage,
                        },
                        audiobookId: nextChapter.audiobookId,
                     })
                  );

                  // Continue playback - duration will be set from onLoad callback
                  dispatch(play());
               } else {
                  // No next chapter, stop playback
                  console.log('[Audio Player] Reached end of audiobook');
                  dispatch(stop());
               }
            } else {
               // Could not find current chapter, stop playback
               console.warn('[Audio Player] Could not find current chapter in list');
               dispatch(stop());
            }
         } catch (error) {
            console.error('[Audio Player] Error auto-advancing to next chapter:', error);
            // On error, stop playback
            dispatch(stop());
         }
      } else {
         // No audiobookId available, stop playback
         console.log('[Audio Player] No audiobookId available for auto-advance');
         dispatch(stop());
      }
   }, [dispatch]);

   /**
    * Handle load data - get total duration from video metadata
    */
   const handleLoad = useCallback(
      (data: OnLoadData) => {
         // Set total duration from video metadata
         if (data.duration) {
            dispatch(setTotalDuration(data.duration));
         }
         dispatch(setLoading(false));
      },
      [dispatch]
   );

   /**
    * Handle error
    */
   const handleError = useCallback(
      (e: {
         error: {
            errorString?: string;
            errorException?: string;
            errorCode?: string | number;
            error?: string;
         };
      }) => {
         console.error('[Audio Player] Playback error:', e);
         const errorMessage =
            e.error?.errorString ||
            e.error?.errorException ||
            e.error?.error ||
            (e.error?.errorCode ? String(e.error.errorCode) : undefined) ||
            'Playback error occurred';
         dispatch(setError(errorMessage));
         dispatch(setLoading(false));
      },
      [dispatch]
   );


   /**
    * Seek to absolute time position (in seconds from start of chapter)
    */
   const seekToTime = useCallback(
      (targetTime: number) => {
         if (!videoRef.current) return;

         // Get fresh values from Redux to avoid stale closures
         // eslint-disable-next-line react-hooks/exhaustive-deps
         const { store } = require('@/store');
         const state = store.getState();
         const freshTotalDuration = state.player.totalDuration;

         if (freshTotalDuration === 0) return;

         // Clamp target time to valid range
         const clampedTime = Math.max(0, Math.min(targetTime, freshTotalDuration));

         // Update position in Redux
         dispatch(setPosition(clampedTime));
         dispatch(seek());

         // Seek the video player - react-native-video handles segment selection automatically
         videoRef.current.seek(clampedTime);
      },
      [dispatch]
   );

   /**
    * Handle seek (10s forward/backward)
    */
   const handleSeek = useCallback(
      (seconds: number) => {
         if (!videoRef.current) return;

         // Get fresh values from Redux to avoid stale closures
         // eslint-disable-next-line react-hooks/exhaustive-deps
         const { store } = require('@/store');
         const state = store.getState();
         const freshPlaybackPosition = state.player.playbackPosition;
         const freshTotalDuration = state.player.totalDuration;

         if (freshTotalDuration === 0) return;

         // Calculate new position
         let newPosition = freshPlaybackPosition + seconds;

         // Clamp to valid range
         newPosition = Math.max(0, Math.min(newPosition, freshTotalDuration));

         // Update position in Redux and clear errors
         dispatch(setPosition(newPosition));
         dispatch(seek());

         // Seek the video player - react-native-video handles segment selection automatically
         videoRef.current.seek(newPosition);
      },
      [dispatch]
   );

   return {
      videoRef,
      masterPlaylistUri,
      headers,
      isPlaying,
      handleProgress,
      handleEnd,
      handleLoad,
      handleError,
      handleSeek,
      seekToTime,
   };
}

