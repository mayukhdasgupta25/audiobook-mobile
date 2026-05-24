/**
 * Audio Player Hook — HLS playback via react-native-track-player.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackPlayer, { Event, State, TrackType } from 'react-native-track-player';
import { RootState, store } from '@/store';
import {
   stop,
   setPosition,
   setTotalDuration,
   setLoading,
   setError,
   seek,
   play,
   pause,
} from '@/store/player';
import { setPlaylist } from '@/store/streaming';
import { initializePlaybackSession, syncPlayback } from '@/services/audiobooks';
import { apiConfig } from '@/services/api';
import {
   advanceToNextChapter,
   skipToNextChapterRemote,
   skipToPreviousChapterRemote,
} from '@/utils/chapterNavigation';
import { resolveChapterPlaybackSource } from '@/utils/chapterStreamUrl';
import {
   registerTrackPlayerHandlers,
   setTrackPlayerDragging,
   getIsDragging,
} from '@/services/trackPlayerController';
import {
   setupTrackPlayerOnce,
   updateTrackPlayerOptions,
} from '@/hooks/useTrackPlayerSetup';
import { registerChapterReload } from '@/services/playbackReload';
import { ensureMediaNotificationPermission } from '@/utils/ensureMediaNotificationPermission';
import { Platform } from 'react-native';

const LOAD_TIMEOUT_MS = 30_000;

function buildArtworkUrl(coverImage: string | null): string | undefined {
   if (!coverImage) {
      return undefined;
   }
   return `${apiConfig.baseURL}${coverImage}`;
}

/**
 * Hook to manage audiobook chapter playback.
 */
export function useAudioPlayer() {
   const dispatch = useDispatch();
   const isDraggingRef = useRef(false);
   const lastLoadedChapterRef = useRef<string | null>(null);
   const lastInitializedChapterRef = useRef<string | null>(null);
   const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const { isPlaying, currentChapterId, chapterMetadata, playbackPosition } = useSelector(
      (state: RootState) => state.player
   );
   const accessToken = useSelector((state: RootState) => state.auth.accessToken);
   const user = useSelector((state: RootState) => state.auth.user);

   const clearLoadTimeout = useCallback(() => {
      if (loadTimeoutRef.current) {
         clearTimeout(loadTimeoutRef.current);
         loadTimeoutRef.current = null;
      }
   }, []);

   const onChapterSwitched = useCallback(
      (chapterId: string) => {
         if (user?.id && lastInitializedChapterRef.current !== chapterId) {
            const state = store.getState().player;
            const bookId = state.audiobookId;
            if (bookId) {
               lastInitializedChapterRef.current = chapterId;
               initializePlaybackSession({
                  userId: user.id,
                  audiobookId: bookId,
                  chapterId,
               }).catch((error: unknown) => {
                  console.error('[Audio Player] Failed to initialize playback session:', error);
               });
            }
         }
      },
      [user?.id]
   );

   const loadChapter = useCallback(async () => {
      if (!currentChapterId || !chapterMetadata || !accessToken || !user?.id) {
         return;
      }

      if (lastLoadedChapterRef.current === currentChapterId) {
         return;
      }

      const state = store.getState().player;
      const resumePosition = state.playbackPosition;
      const skipDurationSeconds = store.getState().settings.skipDurationSeconds;
      const audiobookId = state.audiobookId;

      clearLoadTimeout();
      dispatch(setLoading(true));
      dispatch(setError(null));

      loadTimeoutRef.current = setTimeout(() => {
         const playerState = store.getState().player;
         if (playerState.isLoading && playerState.currentChapterId === currentChapterId) {
            console.warn('[Audio Player] Load timed out');
            dispatch(setError('Audio took too long to load. Check your connection and try again.'));
            dispatch(setLoading(false));
         }
      }, LOAD_TIMEOUT_MS);

      try {
         if (Platform.OS === 'android') {
            await ensureMediaNotificationPermission();
         }
         await setupTrackPlayerOnce();
         await updateTrackPlayerOptions(skipDurationSeconds);

         const playbackSource = await resolveChapterPlaybackSource(
            currentChapterId,
            user.id
         );

         if (!store.getState().streaming.playlistsByChapterId[currentChapterId]) {
            dispatch(
               setPlaylist({
                  chapterId: currentChapterId,
                  playlistData: playbackSource.playlistData,
               })
            );
         }

         if (playbackSource.totalDurationSeconds > 0) {
            dispatch(setTotalDuration(playbackSource.totalDurationSeconds));
         }

         await TrackPlayer.reset();

         const playbackUrl = playbackSource.url;
         if (__DEV__) {
            console.log('[Audio Player] Loading track', {
               platform: Platform.OS,
               url: playbackUrl,
            });
         }

         await TrackPlayer.add({
            id: currentChapterId,
            url: playbackUrl,
            type: TrackType.HLS,
            title: chapterMetadata.title || 'Unknown Chapter',
            artist: 'AudioBook',
            // `album` stores audiobook id for notification tap navigation
            album: audiobookId ?? undefined,
            artwork: buildArtworkUrl(chapterMetadata.coverImage),
            // iOS plays the public bit_transcode HLS URL; auth headers break AVPlayer sub-requests.
            ...(Platform.OS === 'android'
               ? {
                    headers: {
                       Authorization: `Bearer ${accessToken}`,
                    },
                 }
               : {}),
         });

         // Re-apply options after reset so progress events stay enabled on Android
         await updateTrackPlayerOptions(skipDurationSeconds);

         lastLoadedChapterRef.current = currentChapterId;

         if (resumePosition > 0) {
            await TrackPlayer.seekTo(resumePosition);
         }

         if (state.isPlaying) {
            await TrackPlayer.play();
         }

         dispatch(setLoading(false));
         clearLoadTimeout();
      } catch (error: unknown) {
         console.error('[Audio Player] Failed to load chapter:', error);
         dispatch(
            setError(
               error instanceof Error ? error.message : 'Failed to load audio'
            )
         );
         dispatch(setLoading(false));
         clearLoadTimeout();
      }
   }, [
      currentChapterId,
      chapterMetadata,
      accessToken,
      user?.id,
      dispatch,
      clearLoadTimeout,
   ]);

   useEffect(() => {
      lastLoadedChapterRef.current = null;
   }, [currentChapterId]);

   // Register listeners before load/play so early events are not missed
   useEffect(() => {
      const subs = [
         TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
            if (isDraggingRef.current || getIsDragging()) {
               return;
            }
            dispatch(setPosition(event.position));
            if (event.duration > 0) {
               dispatch(setTotalDuration(event.duration));
            }
            dispatch(setLoading(false));
            clearLoadTimeout();
         }),

         TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
            const state = store.getState().player;
            if (!state.audiobookId || !state.currentChapterId) {
               dispatch(stop());
               return;
            }
            lastLoadedChapterRef.current = null;
            await advanceToNextChapter({
               dispatch,
               audiobookId: state.audiobookId,
               currentChapterId: state.currentChapterId,
               isVisible: state.isVisible,
               totalDuration: state.totalDuration,
               onChapterSwitched,
            });
         }),

         TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
            console.error('[Audio Player] Playback error:', event);
            const message =
               'message' in event && typeof event.message === 'string'
                  ? event.message
                  : 'Playback error occurred';
            dispatch(setError(message));
            dispatch(setLoading(false));
            clearLoadTimeout();
         }),

         TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
            const playbackState =
               typeof event === 'object' && event !== null && 'state' in event
                  ? (event as { state: State }).state
                  : (event as State);

            // Keep Redux in sync when play/pause comes from notification or lock screen
            const playerSnapshot = store.getState().player;
            if (playerSnapshot.currentChapterId) {
               if (playbackState === State.Playing && !playerSnapshot.isPlaying) {
                  dispatch(play());
               } else if (
                  (playbackState === State.Paused || playbackState === State.Stopped) &&
                  playerSnapshot.isPlaying
               ) {
                  dispatch(pause());
               }
            }

            if (
               playbackState === State.Ready ||
               playbackState === State.Playing ||
               playbackState === State.Paused ||
               playbackState === State.Buffering
            ) {
               dispatch(setLoading(false));
               clearLoadTimeout();
            }

            if (
               playbackState === State.Playing ||
               playbackState === State.Ready ||
               playbackState === State.Paused
            ) {
               try {
                  const duration = await TrackPlayer.getDuration();
                  if (duration > 0) {
                     dispatch(setTotalDuration(duration));
                  }
               } catch {
                  // Duration not available yet
               }
            }

            if (playbackState === State.Error) {
               dispatch(setError('Playback error occurred'));
               dispatch(setLoading(false));
               clearLoadTimeout();
            }
         }),
      ];

      return () => {
         subs.forEach((sub) => sub.remove());
      };
   }, [dispatch, onChapterSwitched, clearLoadTimeout]);

   useEffect(() => {
      void loadChapter();
   }, [loadChapter]);

   // Poll position — RNTP progress events can be unreliable on Android with HLS
   useEffect(() => {
      if (!currentChapterId) {
         return;
      }

      let mounted = true;

      const syncProgress = async () => {
         if (
            !mounted ||
            lastLoadedChapterRef.current !== currentChapterId ||
            isDraggingRef.current ||
            getIsDragging()
         ) {
            return;
         }

         try {
            const [{ position, duration }, playbackState] = await Promise.all([
               TrackPlayer.getProgress(),
               TrackPlayer.getPlaybackState(),
            ]);

            if (
               !mounted ||
               lastLoadedChapterRef.current !== currentChapterId ||
               isDraggingRef.current ||
               getIsDragging()
            ) {
               return;
            }

            const reduxPlayer = store.getState().player;
            if (playbackState.state === State.Playing && !reduxPlayer.isPlaying) {
               dispatch(play());
            } else if (
               (playbackState.state === State.Paused ||
                  playbackState.state === State.Stopped) &&
               reduxPlayer.isPlaying
            ) {
               dispatch(pause());
            }

            dispatch(setPosition(position));
            if (duration > 0) {
               dispatch(setTotalDuration(duration));
            }
            dispatch(setLoading(false));
            clearLoadTimeout();
         } catch {
            // Player not ready yet
         }
      };

      void syncProgress();
      const intervalId = setInterval(() => {
         void syncProgress();
      }, 1000);

      return () => {
         mounted = false;
         clearInterval(intervalId);
      };
   }, [currentChapterId, dispatch, clearLoadTimeout]);

   useEffect(() => {
      if (!currentChapterId || lastLoadedChapterRef.current !== currentChapterId) {
         return;
      }

      void (async () => {
         try {
            if (isPlaying) {
               await TrackPlayer.play();
            } else {
               await TrackPlayer.pause();
            }
         } catch (error: unknown) {
            console.error('[Audio Player] Failed to sync play state:', error);
         }
      })();
   }, [isPlaying, currentChapterId]);

   const seekToTime = useCallback(
      async (targetTime: number) => {
         const playerState = store.getState().player;
         const freshTotalDuration = playerState.totalDuration;
         const freshChapterId = playerState.currentChapterId;
         const freshAudiobookId = playerState.audiobookId;

         if (freshTotalDuration === 0 && targetTime > 0) {
            return;
         }

         const clampedTime = Math.max(
            0,
            Math.min(targetTime, freshTotalDuration > 0 ? freshTotalDuration : targetTime)
         );

         dispatch(setPosition(clampedTime));
         dispatch(seek());

         try {
            await TrackPlayer.seekTo(clampedTime);
         } catch (error: unknown) {
            console.error('[Audio Player] Seek failed:', error);
         }

         if (playerState.isVisible && freshAudiobookId && freshChapterId) {
            syncPlayback({
               audiobookId: freshAudiobookId,
               chapterId: freshChapterId,
               action: 'seek',
               position: clampedTime,
            }).catch((err: unknown) => {
               console.error('[Audio Player] Failed to sync after seek:', err);
            });
         }
      },
      [dispatch]
   );

   const handleSeek = useCallback(
      (seconds: number) => {
         const playerState = store.getState().player;
         const newPosition = playerState.playbackPosition + seconds;
         void seekToTime(newPosition);
      },
      [seekToTime]
   );

   const playPlayback = useCallback(async () => {
      dispatch(play());
      try {
         await TrackPlayer.play();
      } catch (error: unknown) {
         console.error('[Audio Player] Play failed:', error);
      }
   }, [dispatch]);

   const pausePlayback = useCallback(async () => {
      dispatch(pause());
      try {
         await TrackPlayer.pause();
      } catch (error: unknown) {
         console.error('[Audio Player] Pause failed:', error);
      }
   }, [dispatch]);

   const skipToNextChapter = useCallback(async () => {
      const state = store.getState().player;
      if (!state.audiobookId || !state.currentChapterId) {
         return;
      }
      lastLoadedChapterRef.current = null;
      await skipToNextChapterRemote(
         dispatch,
         state.audiobookId,
         state.currentChapterId,
         onChapterSwitched
      );
   }, [dispatch, onChapterSwitched]);

   const skipToPreviousChapter = useCallback(async () => {
      const state = store.getState().player;
      if (!state.audiobookId || !state.currentChapterId) {
         return;
      }
      lastLoadedChapterRef.current = null;
      await skipToPreviousChapterRemote(
         dispatch,
         state.audiobookId,
         state.currentChapterId,
         onChapterSwitched
      );
   }, [dispatch, onChapterSwitched]);

   const setDragging = useCallback((dragging: boolean) => {
      isDraggingRef.current = dragging;
      setTrackPlayerDragging(dragging);
   }, []);

   const resetPlayer = useCallback(async () => {
      lastLoadedChapterRef.current = null;
      clearLoadTimeout();
      try {
         await TrackPlayer.reset();
      } catch {
         // Player may not be initialized
      }
   }, [clearLoadTimeout]);

   const reloadChapter = useCallback(() => {
      lastLoadedChapterRef.current = null;
      void loadChapter();
   }, [loadChapter]);

   useEffect(() => {
      registerChapterReload(reloadChapter);
      return () => registerChapterReload(null);
   }, [reloadChapter]);

   useEffect(() => {
      registerTrackPlayerHandlers({
         seekToTime: (seconds) => {
            void seekToTime(seconds);
         },
         seekBy: handleSeek,
         skipToNextChapter,
         skipToPreviousChapter,
         playPlayback: () => {
            void playPlayback();
         },
         pausePlayback: () => {
            void pausePlayback();
         },
      });
      return () => registerTrackPlayerHandlers(null);
   }, [
      seekToTime,
      handleSeek,
      skipToNextChapter,
      skipToPreviousChapter,
      playPlayback,
      pausePlayback,
   ]);

   useEffect(() => {
      if (!currentChapterId) {
         void resetPlayer();
      }
   }, [currentChapterId, resetPlayer]);

   return {
      isPlaying,
      playbackPosition,
      seekToTime,
      handleSeek,
      playPlayback,
      pausePlayback,
      skipToNextChapter,
      skipToPreviousChapter,
      setDragging,
      resetPlayer,
   };
}
