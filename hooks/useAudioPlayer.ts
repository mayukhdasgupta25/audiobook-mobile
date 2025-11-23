/**
 * Audio Player Hook
 * Manages audio playback using react-native-video with segment-based streaming
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OnProgressData } from 'react-native-video';
import type { VideoRef } from 'react-native-video';
import { RootState } from '@/store';
import {
   stop,
   setSegmentIndex,
   setPosition,
   setTotalDuration,
   setLoading,
   setError,
   seek,
} from '@/store/player';
import { fetchSegmentAsFile, preFetchSegment } from '@/utils/segmentManager';

/**
 * Hook to manage audio playback for chapters
 * Handles segment loading, playback, and pre-fetching
 */
export function useAudioPlayer() {
   const dispatch = useDispatch();
   const videoRef = useRef<VideoRef>(null);
   const preFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // Get player state from Redux
   const {
      isPlaying,
      currentChapterId,
      currentSegmentIndex,
      playbackPosition,
   } = useSelector((state: RootState) => state.player);

   // Get playlist data from Redux
   const playlistData = useSelector((state: RootState) =>
      currentChapterId
         ? state.streaming.playlistsByChapterId[currentChapterId]
         : null
   );

   // Get userId from Redux
   const userId = useSelector((state: RootState) => state.auth.user?.id);

   // Current segment URI
   const [currentSegmentUri, setCurrentSegmentUri] = useState<string | null>(null);

   /**
    * Load and prepare a segment for playback
    */
   const loadSegment = useCallback(
      async (segmentIndex: number) => {
         if (!playlistData || !currentChapterId || !userId) {
            return;
         }

         const segments = playlistData.playlist.segments;
         if (segmentIndex >= segments.length) {
            // Reached end of chapter
            dispatch(stop());
            return;
         }

         const segment = segments[segmentIndex];
         dispatch(setLoading(true));
         dispatch(setError(null));

         try {
            // Fetch segment and get file URI
            const segmentUri = await fetchSegmentAsFile(
               currentChapterId,
               segment.segmentId,
               playlistData.selectedBitrate.toString(),
               userId
            );

            setCurrentSegmentUri(segmentUri);

            // Calculate and set total duration if not already set
            if (playlistData) {
               const total = playlistData.playlist.segments.reduce(
                  (sum, seg) => sum + seg.duration,
                  0
               );
               dispatch(setTotalDuration(total));
            }

            dispatch(setLoading(false));
         } catch (error) {
            console.error('[Audio Player] Error loading segment:', error);
            dispatch(
               setError(
                  error instanceof Error
                     ? error.message
                     : 'Failed to load audio segment'
               )
            );
            dispatch(setLoading(false));
         }
      },
      [playlistData, currentChapterId, userId, dispatch]
   );

   /**
    * Handle playback progress
    */
   const handleProgress = useCallback(
      (data: OnProgressData) => {
         const currentTime = data.currentTime;
         dispatch(setPosition(currentTime));

         // Check if segment is ending (80% complete) to pre-fetch next
         if (playlistData && currentChapterId && userId) {
            const segments = playlistData.playlist.segments;
            const currentSegment = segments[currentSegmentIndex];

            if (currentSegment && currentSegmentIndex < segments.length - 1) {
               const progress = currentTime / currentSegment.duration;
               if (progress >= 0.8 && !preFetchTimeoutRef.current) {
                  // Pre-fetch next segment
                  const nextSegment = segments[currentSegmentIndex + 1];
                  preFetchSegment(
                     currentChapterId,
                     nextSegment.segmentId,
                     playlistData.selectedBitrate.toString(),
                     userId
                  ).catch((error) => {
                     console.warn('[Audio Player] Pre-fetch failed:', error);
                  });

                  // Set timeout to prevent multiple pre-fetches
                  preFetchTimeoutRef.current = setTimeout(() => {
                     preFetchTimeoutRef.current = null;
                  }, 2000);
               }
            }
         }
      },
      [playlistData, currentChapterId, currentSegmentIndex, userId, dispatch]
   );

   /**
    * Handle segment end
    */
   const handleEnd = useCallback(() => {
      if (playlistData) {
         const segments = playlistData.playlist.segments;
         const nextIndex = currentSegmentIndex + 1;
         if (nextIndex < segments.length) {
            // Move to next segment
            dispatch(setSegmentIndex(nextIndex));
         } else {
            // Reached end of chapter
            dispatch(stop());
         }
      }
   }, [playlistData, currentSegmentIndex, dispatch]);

   /**
    * Handle load data
    */
   const handleLoad = useCallback(() => {
      // Segment loaded successfully
      dispatch(setLoading(false));
   }, [dispatch]);

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
    * Load segment when segment index changes or playlist becomes available
    */
   useEffect(() => {
      if (currentChapterId && playlistData && playlistData.playlist.segments.length > 0) {
         loadSegment(currentSegmentIndex);
      }
   }, [currentSegmentIndex, currentChapterId, playlistData, loadSegment]);

   /**
    * Cleanup on unmount
    */
   useEffect(() => {
      return () => {
         // Clear timeout
         if (preFetchTimeoutRef.current) {
            clearTimeout(preFetchTimeoutRef.current);
         }
      };
   }, []);

   /**
    * Handle seek (10s forward/backward)
    */
   const handleSeek = useCallback(
      (seconds: number) => {
         if (!videoRef.current || !playlistData) return;

         const segments = playlistData.playlist.segments;
         const currentSegment = segments[currentSegmentIndex];
         if (!currentSegment) return;

         let newPosition = playbackPosition + seconds;
         let newSegmentIndex = currentSegmentIndex;

         // Handle backward seek
         if (newPosition < 0) {
            if (newSegmentIndex > 0) {
               // Move to previous segment
               newSegmentIndex = newSegmentIndex - 1;
               const prevSegment = segments[newSegmentIndex];
               newPosition = Math.max(0, prevSegment.duration + newPosition);
            } else {
               newPosition = 0;
            }
         }
         // Handle forward seek
         else if (newPosition > currentSegment.duration) {
            if (newSegmentIndex < segments.length - 1) {
               // Move to next segment
               newSegmentIndex = newSegmentIndex + 1;
               newPosition = newPosition - currentSegment.duration;
               const nextSegment = segments[newSegmentIndex];
               if (newPosition > nextSegment.duration) {
                  newPosition = nextSegment.duration;
               }
            } else {
               newPosition = currentSegment.duration;
            }
         }

         // Update segment if needed
         if (newSegmentIndex !== currentSegmentIndex) {
            dispatch(setSegmentIndex(newSegmentIndex));
         }

         // Update position in Redux and clear errors
         dispatch(setPosition(newPosition));
         dispatch(seek());
         // Actually seek the video player
         videoRef.current?.seek(newPosition);
      },
      [playlistData, currentSegmentIndex, playbackPosition, dispatch]
   );

   return {
      videoRef,
      currentSegmentUri,
      isPlaying,
      handleProgress,
      handleEnd,
      handleLoad,
      handleError,
      handleSeek,
   };
}

