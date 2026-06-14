/**
 * Audio Player Hook — HLS playback via react-native-track-player.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackPlayer, { Event, State, TrackType, PitchAlgorithm } from 'react-native-track-player';
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
} from '@/services/trackPlayerSetup';
import { setupPlaybackServiceHandlers } from '@/services/playbackServiceHandlers';
import { registerChapterReload } from '@/services/playbackReload';
import { ensureMediaNotificationPermission } from '@/utils/ensureMediaNotificationPermission';
import { isActivePlaybackSession } from '@/utils/playbackSession';
import { teardownTrackPlayerPlayback } from '@/services/playbackTeardown';
import {
   syncTrackProgressToPlayerStore,
   clearPlayerLoadingIfNeeded,
} from '@/utils/playerStoreSync';
import { clampPlaybackSeekSeconds, getMaxSeekableSeconds } from '@/utils/playbackPosition';
import { CHAPTER_END_POSITION_MARGIN_SEC } from '@/constants/playbackConstants';
import { notifyNextChapterPrefetchProgress } from '@/services/nextChapterPrefetchProgress';
import { Platform } from 'react-native';
import type { PlaybackSpeed } from '@/constants/playbackSpeed';
import { applyPlaybackSpeed } from '@/utils/applyPlaybackSpeed';
import { usePlayingChapterBounds } from '@/hooks/usePlayingChapterBounds';
import { usePreferredPlaybackBitrate } from '@/hooks/usePreferredPlaybackBitrate';
import { getNextLowerBitrateKbps } from '@/utils/audioQualityDisplay';
import { shouldPauseAtChapterEnd } from '@/utils/sleepTimer';
import { clearSleepTimer } from '@/store/settings';

const LOAD_TIMEOUT_MS = 30_000;

function buildArtworkUrl(coverImage: string | null): string | undefined {
   if (!coverImage) {
      return undefined;
   }
   return `${apiConfig.baseURL}${coverImage}`;
}

function isAuthPlaybackError(error: unknown): boolean {
   const message = error instanceof Error ? error.message : String(error ?? '');
   return /\b(401|403|unauthorized|forbidden)\b/i.test(message);
}

function shouldAttemptBitrateFallback(error?: unknown): boolean {
   if (error !== undefined && isAuthPlaybackError(error)) {
      return false;
   }
   return true;
}

/**
 * Hook to manage audiobook chapter playback.
 */
export function useAudioPlayer() {
   const dispatch = useDispatch();
   usePlayingChapterBounds();
   const preferredPlaybackBitrate = usePreferredPlaybackBitrate();
   const isDraggingRef = useRef(false);
   const lastLoadedChapterRef = useRef<string | null>(null);
   const lastInitializedChapterRef = useRef<string | null>(null);
   const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const chapterBitrateAttemptRef = useRef(preferredPlaybackBitrate);
   const loadChapterRef = useRef<() => Promise<void>>(async () => {});
   const isAdvancingChapterRef = useRef(false);

   const { isPlaying, currentChapterId, chapterMetadata, playbackPosition } = useSelector(
      (state: RootState) => state.player
   );
   const wasPlayingRef = useRef(isPlaying);
   const accessToken = useSelector((state: RootState) => state.auth.accessToken);
   const user = useSelector((state: RootState) => state.auth.user);
   const playbackSpeed = useSelector((state: RootState) => state.settings.playbackSpeed);

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

   const handleChapterEnded = useCallback(async () => {
      if (isAdvancingChapterRef.current) {
         return;
      }
      isAdvancingChapterRef.current = true;
      try {
         const state = store.getState().player;
         if (!state.audiobookId || !state.currentChapterId) {
            dispatch(stop());
            return;
         }
         if (shouldPauseAtChapterEnd(store.getState().settings)) {
            store.dispatch(clearSleepTimer());
            dispatch(pause());
            try {
               await TrackPlayer.pause();
            } catch (error: unknown) {
               console.warn('[Audio Player] Sleep timer pause failed:', error);
            }
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
      } finally {
         isAdvancingChapterRef.current = false;
      }
   }, [dispatch, onChapterSwitched]);

   const maybeTriggerChapterEndFromPosition = useCallback(
      (position: number, duration: number) => {
         if (!store.getState().player.isPlaying) {
            return;
         }
         const { chapterEndPosition } = store.getState().player;
         const effectiveEnd = getMaxSeekableSeconds(duration, chapterEndPosition);
         if (position >= effectiveEnd - CHAPTER_END_POSITION_MARGIN_SEC) {
            void handleChapterEnded();
         }
      },
      [handleChapterEnded]
   );

   const attemptBitrateFallback = useCallback((reason: string, error?: unknown): boolean => {
      if (!shouldAttemptBitrateFallback(error)) {
         return false;
      }

      const currentBitrate = chapterBitrateAttemptRef.current;
      const nextBitrate = getNextLowerBitrateKbps(currentBitrate);
      if (nextBitrate === null) {
         return false;
      }

      if (__DEV__) {
         console.warn(
            `[Audio Player] Falling back ${currentBitrate}k → ${nextBitrate}k (${reason})`
         );
      }

      chapterBitrateAttemptRef.current = nextBitrate;
      lastLoadedChapterRef.current = null;
      return true;
   }, []);

   const loadChapter = useCallback(async () => {
      if (!isActivePlaybackSession()) {
         return;
      }

      if (!currentChapterId || !chapterMetadata || !accessToken || !user?.id) {
         return;
      }

      if (lastLoadedChapterRef.current === currentChapterId) {
         return;
      }

      const state = store.getState().player;
      const resumePosition = state.playbackPosition;
      const { skipDurationSeconds, playbackSpeed: speed } = store.getState().settings;
      const audiobookId = state.audiobookId;

      clearLoadTimeout();
      dispatch(setLoading(true));
      dispatch(setError(null));

      loadTimeoutRef.current = setTimeout(() => {
         if (!isActivePlaybackSession()) {
            return;
         }
         const playerState = store.getState().player;
         if (playerState.isLoading && playerState.currentChapterId === currentChapterId) {
            console.warn('[Audio Player] Load timed out');
            if (attemptBitrateFallback('load timeout')) {
               void loadChapterRef.current();
               return;
            }
            dispatch(setError('Audio took too long to load. Check your connection and try again.'));
            dispatch(setLoading(false));
         }
      }, LOAD_TIMEOUT_MS);

      try {
         if (Platform.OS === 'android') {
            await ensureMediaNotificationPermission();
         }
         await setupTrackPlayerOnce();
         if (Platform.OS === 'android') {
            setupPlaybackServiceHandlers();
         }
         await updateTrackPlayerOptions(skipDurationSeconds, speed);

         const playbackSource = await resolveChapterPlaybackSource(
            currentChapterId,
            user.id,
            { forceBitrateKbps: chapterBitrateAttemptRef.current }
         );

         dispatch(
            setPlaylist({
               chapterId: currentChapterId,
               playlistData: playbackSource.playlistData,
            })
         );

         if (!isActivePlaybackSession()) {
            clearLoadTimeout();
            return;
         }

         if (playbackSource.totalDurationSeconds > 0) {
            const { totalDuration } = store.getState().player;
            if (
               Math.abs(totalDuration - playbackSource.totalDurationSeconds) >= 0.5
            ) {
               dispatch(setTotalDuration(playbackSource.totalDurationSeconds));
            }
         }

         await TrackPlayer.reset();

         const playbackUrl = playbackSource.url;
         if (__DEV__) {
            console.log('[Audio Player] Loading track', {
               platform: Platform.OS,
               bitrateKbps: chapterBitrateAttemptRef.current,
               url: playbackUrl,
            });
         }

         await TrackPlayer.add({
            id: currentChapterId,
            url: playbackUrl,
            type: TrackType.HLS,
            title: chapterMetadata.title || 'Unknown Chapter',
            artist: chapterMetadata.audiobookTitle ?? 'AudioBook',
            // `album` stores audiobook id for notification tap navigation
            album: audiobookId ?? undefined,
            artwork: buildArtworkUrl(chapterMetadata.coverImage),
            ...(speed !== 1 ? { pitchAlgorithm: PitchAlgorithm.Voice } : {}),
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
         await updateTrackPlayerOptions(skipDurationSeconds, speed);

         lastLoadedChapterRef.current = currentChapterId;

         if (resumePosition > 0) {
            await TrackPlayer.seekTo(resumePosition);
         }

         await applyPlaybackSpeed(speed);

         if (state.isPlaying) {
            await TrackPlayer.play();
         }

         if (isActivePlaybackSession()) {
            dispatch(setLoading(false));
         }
         clearLoadTimeout();
      } catch (error: unknown) {
         console.error('[Audio Player] Failed to load chapter:', error);
         if (attemptBitrateFallback('load failure', error)) {
            clearLoadTimeout();
            void loadChapterRef.current();
            return;
         }
         if (isActivePlaybackSession()) {
            dispatch(
               setError(
                  error instanceof Error ? error.message : 'Failed to load audio'
               )
            );
            dispatch(setLoading(false));
         }
         clearLoadTimeout();
      }
   }, [
      currentChapterId,
      chapterMetadata,
      accessToken,
      user?.id,
      dispatch,
      clearLoadTimeout,
      attemptBitrateFallback,
   ]);

   useEffect(() => {
      loadChapterRef.current = loadChapter;
   }, [loadChapter]);

   useEffect(() => {
      lastLoadedChapterRef.current = null;
      chapterBitrateAttemptRef.current = preferredPlaybackBitrate;
   }, [currentChapterId, preferredPlaybackBitrate]);

   // Register listeners before load/play so early events are not missed
   useEffect(() => {
      const subs = [
         TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
            if (!isActivePlaybackSession()) {
               return;
            }
            if (isDraggingRef.current || getIsDragging()) {
               return;
            }
            if (!store.getState().player.isPlaying) {
               clearPlayerLoadingIfNeeded(dispatch);
               return;
            }
            syncTrackProgressToPlayerStore(
               dispatch,
               event.position,
               event.duration
            );
            notifyNextChapterPrefetchProgress(event.position, event.duration);
            maybeTriggerChapterEndFromPosition(event.position, event.duration);
            clearLoadTimeout();
         }),

         TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
            await handleChapterEnded();
         }),

         TrackPlayer.addEventListener(Event.PlaybackError, (event) => {
            if (!isActivePlaybackSession()) {
               return;
            }
            console.error('[Audio Player] Playback error:', event);
            const message =
               'message' in event && typeof event.message === 'string'
                  ? event.message
                  : 'Playback error occurred';
            if (attemptBitrateFallback('playback error', message)) {
               clearLoadTimeout();
               dispatch(setError(null));
               void loadChapterRef.current();
               return;
            }
            dispatch(setError(message));
            dispatch(setLoading(false));
            clearLoadTimeout();
         }),

         TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
            if (!isActivePlaybackSession()) {
               return;
            }

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
               clearPlayerLoadingIfNeeded(dispatch);
               clearLoadTimeout();
            }

            if (
               playbackState === State.Playing ||
               playbackState === State.Ready
            ) {
               try {
                  const duration = await TrackPlayer.getDuration();
                  if (duration > 0) {
                     const { totalDuration } = store.getState().player;
                     if (Math.abs(totalDuration - duration) >= 0.5) {
                        dispatch(setTotalDuration(duration));
                     }
                  }
               } catch {
                  // Duration not available yet
               }
            }

            if (playbackState === State.Paused || playbackState === State.Stopped) {
               try {
                  const { position, duration } = await TrackPlayer.getProgress();
                  syncTrackProgressToPlayerStore(dispatch, position, duration);
               } catch {
                  // Progress not available yet
               }
            }

            if (playbackState === State.Error) {
               if (attemptBitrateFallback('playback state error')) {
                  clearLoadTimeout();
                  dispatch(setError(null));
                  void loadChapterRef.current();
                  return;
               }
               dispatch(setError('Playback error occurred'));
               dispatch(setLoading(false));
               clearLoadTimeout();
            }
         }),
      ];

      return () => {
         subs.forEach((sub) => sub.remove());
      };
   }, [
      dispatch,
      onChapterSwitched,
      clearLoadTimeout,
      attemptBitrateFallback,
      handleChapterEnded,
      maybeTriggerChapterEndFromPosition,
   ]);

   useEffect(() => {
      void loadChapter();
   }, [loadChapter]);

   const syncProgressFromTrackPlayer = useCallback(async () => {
      if (!isActivePlaybackSession() || !currentChapterId) {
         return;
      }

      if (
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

         if (lastLoadedChapterRef.current !== currentChapterId) {
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

         if (!isActivePlaybackSession()) {
            return;
         }

         const trackIsPlaying = playbackState.state === State.Playing;
         if (trackIsPlaying) {
            syncTrackProgressToPlayerStore(dispatch, position, duration);
            notifyNextChapterPrefetchProgress(position, duration);
            maybeTriggerChapterEndFromPosition(position, duration);
         } else {
            clearPlayerLoadingIfNeeded(dispatch);
         }
         clearLoadTimeout();
      } catch {
         // Player not ready yet
      }
   }, [currentChapterId, dispatch, clearLoadTimeout, maybeTriggerChapterEndFromPosition]);

   // Poll only while playing — RNTP progress events can be unreliable on Android with HLS
   useEffect(() => {
      if (!currentChapterId || !isPlaying) {
         return;
      }

      void syncProgressFromTrackPlayer();
      const intervalId = setInterval(() => {
         void syncProgressFromTrackPlayer();
      }, 1000);

      return () => {
         clearInterval(intervalId);
      };
   }, [currentChapterId, isPlaying, syncProgressFromTrackPlayer]);

   // One final position sync when pausing so UI shows the frozen time without ongoing polls
   useEffect(() => {
      if (wasPlayingRef.current && !isPlaying && currentChapterId) {
         void syncProgressFromTrackPlayer();
      }
      wasPlayingRef.current = isPlaying;
   }, [isPlaying, currentChapterId, syncProgressFromTrackPlayer]);

   useEffect(() => {
      if (
         !isActivePlaybackSession() ||
         !currentChapterId ||
         lastLoadedChapterRef.current !== currentChapterId
      ) {
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

         const clampedTime = clampPlaybackSeekSeconds(
            targetTime,
            freshTotalDuration > 0 ? freshTotalDuration : 0,
            playerState.chapterEndPosition
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
               durationSeconds:
                  freshTotalDuration > 0 ? freshTotalDuration : undefined,
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
      lastInitializedChapterRef.current = null;
      clearLoadTimeout();
      await teardownTrackPlayerPlayback();
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

   const setPlaybackRate = useCallback((speed: PlaybackSpeed) => {
      void applyPlaybackSpeed(speed);
   }, []);

   useEffect(() => {
      if (!currentChapterId || lastLoadedChapterRef.current !== currentChapterId) {
         return;
      }
      void applyPlaybackSpeed(playbackSpeed);
   }, [playbackSpeed, currentChapterId]);

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
      setPlaybackRate,
   };
}
