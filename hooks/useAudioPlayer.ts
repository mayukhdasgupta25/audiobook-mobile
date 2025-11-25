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
import { fetchSegmentAsFile, preFetchSegment, clearSegmentCache, getCachedSegmentUri } from '@/utils/segmentManager';
import { getChapters, type Chapter } from '@/services/audiobooks';
import { setChapter, play } from '@/store/player';

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
   } = useSelector((state: RootState) => state.player);

   // Get playlist data from Redux
   // IMPORTANT: Get currentChapterId from state inside selector to avoid stale closure
   const playlistData = useSelector((state: RootState) => {
      const chapterId = state.player.currentChapterId;
      return chapterId ? state.streaming.playlistsByChapterId[chapterId] : null;
   });

   // Get userId from Redux
   const userId = useSelector((state: RootState) => state.auth.user?.id);

   // Current segment URI
   const [currentSegmentUri, setCurrentSegmentUri] = useState<string | null>(null);

   /**
    * Load and prepare a segment for playback
    */
   const loadSegment = useCallback(
      async (segmentIndex: number) => {
         // Get fresh values from Redux to avoid stale closures
         // eslint-disable-next-line react-hooks/exhaustive-deps
         const { store } = require('@/store');
         const state = store.getState();
         const freshChapterId = state.player.currentChapterId;
         const freshPlaylistData = freshChapterId
            ? state.streaming.playlistsByChapterId[freshChapterId]
            : null;
         const freshUserId = state.auth.user?.id;

         if (!freshPlaylistData || !freshChapterId || !freshUserId) {
            console.warn('[Audio Player] Cannot load segment - missing data', {
               hasPlaylistData: !!freshPlaylistData,
               freshChapterId,
               freshUserId,
            });
            return;
         }

         const segments = freshPlaylistData.playlist.segments;
         if (segmentIndex >= segments.length) {
            // Reached end of chapter
            dispatch(stop());
            return;
         }

         const segment = segments[segmentIndex];

         // Debug logging to track segment selection
         console.log('[Audio Player] Loading segment', {
            chapterId: freshChapterId,
            segmentIndex,
            segmentId: segment.segmentId,
            totalSegments: segments.length,
            segmentPath: segment.path,
         });

         dispatch(setLoading(true));
         dispatch(setError(null));

         try {
            // Fetch segment and get file URI
            // Pass init segment URI for fragmented MP4 if available
            // Use fresh values to ensure we're using the correct chapter
            const segmentUri = await fetchSegmentAsFile(
               freshChapterId,
               segment.segmentId,
               freshPlaylistData.selectedBitrate.toString(),
               freshUserId,
               freshPlaylistData.playlist.initSegmentUri
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

         // Get fresh values from Redux to avoid stale closures
         // eslint-disable-next-line react-hooks/exhaustive-deps
         const { store } = require('@/store');
         const state = store.getState();
         const freshChapterId = state.player.currentChapterId;
         const freshSegmentIndex = state.player.currentSegmentIndex;
         const freshPlaylistData = freshChapterId
            ? state.streaming.playlistsByChapterId[freshChapterId]
            : null;
         const freshUserId = state.auth.user?.id;

         // Check if segment is ending (80% complete) to pre-fetch next
         if (freshPlaylistData && freshChapterId && freshUserId) {
            const segments = freshPlaylistData.playlist.segments;
            const currentSegment = segments[freshSegmentIndex];

            if (currentSegment && freshSegmentIndex < segments.length - 1) {
               const progress = currentTime / currentSegment.duration;
               if (progress >= 0.8 && !preFetchTimeoutRef.current) {
                  // Pre-fetch next segment in background without blocking playback
                  const nextSegment = segments[freshSegmentIndex + 1];

                  // Defer pre-fetch to next event loop tick to avoid blocking
                  setTimeout(() => {
                     preFetchSegment(
                        freshChapterId,
                        nextSegment.segmentId,
                        freshPlaylistData.selectedBitrate.toString(),
                        freshUserId,
                        freshPlaylistData.playlist.initSegmentUri
                     ).catch((error) => {
                        console.warn('[Audio Player] Pre-fetch failed:', error);
                     });
                  }, 0);

                  // Set timeout to prevent multiple pre-fetches
                  preFetchTimeoutRef.current = setTimeout(() => {
                     preFetchTimeoutRef.current = null;
                  }, 2000);
               }
            }
         }
      },
      [dispatch]
   );

   /**
    * Handle segment end
    */
   const handleEnd = useCallback(async () => {
      // Get fresh values from Redux to avoid stale closures
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const { store } = require('@/store');
      const state = store.getState();
      const freshChapterId = state.player.currentChapterId;
      const freshSegmentIndex = state.player.currentSegmentIndex;
      const freshAudiobookId = state.player.audiobookId;
      const freshPlaylistData = freshChapterId
         ? state.streaming.playlistsByChapterId[freshChapterId]
         : null;

      if (freshPlaylistData) {
         const segments = freshPlaylistData.playlist.segments;
         const nextIndex = freshSegmentIndex + 1;
         if (nextIndex < segments.length) {
            // Move to next segment
            dispatch(setSegmentIndex(nextIndex));
         } else {
            // Reached end of chapter - try to auto-advance to next chapter
            if (freshAudiobookId) {
               try {
                  // Fetch all chapters for the audiobook
                  // We'll fetch pages until we have all chapters or find the next one
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

                        // Switch to next chapter
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

                        // Wait for playlist to load (it will be fetched by useStreamingPlaylist hook)
                        // We'll check if playlist is already loaded, otherwise wait a bit
                        let attempts = 0;
                        const maxAttempts = 20; // Wait up to 2 seconds (20 * 100ms)

                        const checkPlaylist = setInterval(() => {
                           const currentState = store.getState();
                           const nextPlaylistData = currentState.streaming.playlistsByChapterId[nextChapter.id];

                           if (nextPlaylistData) {
                              clearInterval(checkPlaylist);

                              // Calculate total duration
                              const totalDuration = nextPlaylistData.playlist.segments.reduce(
                                 (sum: number, seg: { duration: number }) => sum + seg.duration,
                                 0
                              );
                              dispatch(setTotalDuration(totalDuration));

                              // Continue playback
                              dispatch(play());
                              console.log('[Audio Player] Next chapter playlist loaded, continuing playback');
                           } else {
                              attempts++;
                              if (attempts >= maxAttempts) {
                                 clearInterval(checkPlaylist);
                                 console.warn('[Audio Player] Timeout waiting for next chapter playlist');
                                 dispatch(stop());
                              }
                           }
                        }, 100);
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
         }
      }
   }, [dispatch]);

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
    * Reset segment URI and clear cache when chapter changes to force reload
    */
   useEffect(() => {
      console.log('[Audio Player] Chapter changed, resetting segment URI and clearing cache', { currentChapterId });
      setCurrentSegmentUri(null);
      // Clear segment cache for previous chapter to ensure fresh fetch
      // Note: We clear all cache to avoid any cross-chapter contamination
      clearSegmentCache();
   }, [currentChapterId]);

   /**
    * Load segment when segment index changes or playlist becomes available
    */
   useEffect(() => {
      if (currentChapterId && playlistData && playlistData.playlist.segments.length > 0) {
         console.log('[Audio Player] Effect triggered - loading segment', {
            currentChapterId,
            currentSegmentIndex,
            segmentsCount: playlistData.playlist.segments.length,
         });
         loadSegment(currentSegmentIndex);
      } else {
         console.log('[Audio Player] Effect triggered but conditions not met', {
            currentChapterId,
            hasPlaylistData: !!playlistData,
            segmentsCount: playlistData?.playlist?.segments?.length || 0,
         });
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
    * Seek to absolute time position (in seconds from start of chapter)
    */
   const seekToTime = useCallback(
      async (targetTime: number) => {
         // Get fresh values from Redux to avoid stale closures
         // eslint-disable-next-line react-hooks/exhaustive-deps
         const { store } = require('@/store');
         const state = store.getState();
         const freshChapterId = state.player.currentChapterId;
         const freshSegmentIndex = state.player.currentSegmentIndex;
         const freshTotalDuration = state.player.totalDuration;
         const freshPlaylistData = freshChapterId
            ? state.streaming.playlistsByChapterId[freshChapterId]
            : null;
         const freshUserId = state.auth.user?.id;

         if (!freshPlaylistData || !videoRef.current || freshTotalDuration === 0 || !freshUserId) return;

         const segments = freshPlaylistData.playlist.segments;

         // Clamp target time to valid range
         const clampedTime = Math.max(0, Math.min(targetTime, freshTotalDuration));

         // Find which segment this time falls into
         let accumulatedTime = 0;
         let targetSegmentIndex = 0;
         let positionInSegment = 0;

         for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (clampedTime <= accumulatedTime + segment.duration) {
               targetSegmentIndex = i;
               positionInSegment = clampedTime - accumulatedTime;
               break;
            }
            accumulatedTime += segment.duration;
         }

         // If we're past all segments, use the last segment
         if (targetSegmentIndex >= segments.length) {
            targetSegmentIndex = segments.length - 1;
            positionInSegment = segments[targetSegmentIndex].duration;
         }

         const targetSegment = segments[targetSegmentIndex];

         // Check if target segment is cached
         const cachedUri = getCachedSegmentUri(
            freshChapterId,
            targetSegment.segmentId,
            freshPlaylistData.selectedBitrate.toString()
         );

         // If segment is not cached and we're switching segments, load it first
         if (!cachedUri && targetSegmentIndex !== freshSegmentIndex) {
            // Show loading state only if we need to fetch
            dispatch(setLoading(true));
            try {
               // Load the target segment before seeking
               await loadSegment(targetSegmentIndex);
            } catch (error) {
               console.error('[Audio Player] Error loading segment for seek:', error);
               dispatch(setLoading(false));
               dispatch(
                  setError(
                     error instanceof Error
                        ? error.message
                        : 'Failed to load segment for seek'
                  )
               );
               return;
            }
         }

         // Update segment if needed
         if (targetSegmentIndex !== freshSegmentIndex) {
            dispatch(setSegmentIndex(targetSegmentIndex));
         }

         // Update position in Redux
         dispatch(setPosition(positionInSegment));
         dispatch(seek());
         dispatch(setLoading(false));

         // Seek the video player
         videoRef.current?.seek(positionInSegment);
      },
      [dispatch, loadSegment]
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
         const freshChapterId = state.player.currentChapterId;
         const freshSegmentIndex = state.player.currentSegmentIndex;
         const freshPlaybackPosition = state.player.playbackPosition;
         const freshPlaylistData = freshChapterId
            ? state.streaming.playlistsByChapterId[freshChapterId]
            : null;

         if (!freshPlaylistData) return;

         const segments = freshPlaylistData.playlist.segments;
         const currentSegment = segments[freshSegmentIndex];
         if (!currentSegment) return;

         let newPosition = freshPlaybackPosition + seconds;
         let newSegmentIndex = freshSegmentIndex;

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
         if (newSegmentIndex !== freshSegmentIndex) {
            dispatch(setSegmentIndex(newSegmentIndex));
         }

         // Update position in Redux and clear errors
         dispatch(setPosition(newPosition));
         dispatch(seek());
         // Actually seek the video player
         videoRef.current?.seek(newPosition);
      },
      [dispatch]
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
      seekToTime,
   };
}

