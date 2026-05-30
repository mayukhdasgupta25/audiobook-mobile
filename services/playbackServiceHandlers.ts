/**
 * RNTP remote event handlers (notification / lock screen).
 * Imported from the main app — not from the headless playback service module.
 */

import TrackPlayer, { Event } from 'react-native-track-player';
import { store } from '@/store';
import { pause, play, setPosition } from '@/store/player';
import {
   skipToNextChapterRemote,
   skipToPreviousChapterRemote,
} from '@/utils/chapterNavigation';
import { applyPlaybackSpeed } from '@/utils/applyPlaybackSpeed';
import {
   getNextPlaybackSpeed,
   getPreviousPlaybackSpeed,
} from '@/utils/playbackSpeed';

let handlersRegistered = false;

export function setupPlaybackServiceHandlers(): void {
   if (handlersRegistered) {
      return;
   }
   handlersRegistered = true;

   TrackPlayer.addEventListener(Event.RemotePlay, () => {
      void (async () => {
         try {
            await TrackPlayer.play();
            store.dispatch(play());
         } catch (error: unknown) {
            console.error('[playbackService] RemotePlay failed:', error);
         }
      })();
   });

   TrackPlayer.addEventListener(Event.RemotePause, () => {
      void (async () => {
         try {
            await TrackPlayer.pause();
            store.dispatch(pause());
         } catch (error: unknown) {
            console.error('[playbackService] RemotePause failed:', error);
         }
      })();
   });

   TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
      if (event.position == null) {
         return;
      }
      const position = event.position;
      void (async () => {
         try {
            await TrackPlayer.seekTo(position);
            store.dispatch(setPosition(position));
         } catch (error: unknown) {
            console.error('[playbackService] RemoteSeek failed:', error);
         }
      })();
   });

   TrackPlayer.addEventListener(Event.RemoteJumpForward, () => {
      void (async () => {
         try {
            const seconds = store.getState().settings.skipDurationSeconds;
            const { position } = await TrackPlayer.getProgress();
            const next = position + seconds;
            await TrackPlayer.seekTo(next);
            store.dispatch(setPosition(next));
         } catch (error: unknown) {
            console.error('[playbackService] RemoteJumpForward failed:', error);
         }
      })();
   });

   TrackPlayer.addEventListener(Event.RemoteJumpBackward, () => {
      void (async () => {
         try {
            const seconds = store.getState().settings.skipDurationSeconds;
            const { position } = await TrackPlayer.getProgress();
            const next = Math.max(0, position - seconds);
            await TrackPlayer.seekTo(next);
            store.dispatch(setPosition(next));
         } catch (error: unknown) {
            console.error('[playbackService] RemoteJumpBackward failed:', error);
         }
      })();
   });

   TrackPlayer.addEventListener(Event.RemoteNext, () => {
      const state = store.getState().player;
      if (!state.audiobookId || !state.currentChapterId) {
         return;
      }
      void skipToNextChapterRemote(
         store.dispatch,
         state.audiobookId,
         state.currentChapterId
      ).catch((error: unknown) => {
         console.error('[playbackService] RemoteNext failed:', error);
      });
   });

   TrackPlayer.addEventListener(Event.RemotePrevious, () => {
      const state = store.getState().player;
      if (!state.audiobookId || !state.currentChapterId) {
         return;
      }
      void skipToPreviousChapterRemote(
         store.dispatch,
         state.audiobookId,
         state.currentChapterId
      ).catch((error: unknown) => {
         console.error('[playbackService] RemotePrevious failed:', error);
      });
   });

   TrackPlayer.addEventListener(Event.RemoteLike, () => {
      const current = store.getState().settings.playbackSpeed;
      void applyPlaybackSpeed(getNextPlaybackSpeed(current)).catch((error: unknown) => {
         console.error('[playbackService] RemoteLike (speed) failed:', error);
      });
   });

   TrackPlayer.addEventListener(Event.RemoteDislike, () => {
      const current = store.getState().settings.playbackSpeed;
      void applyPlaybackSpeed(getPreviousPlaybackSpeed(current)).catch((error: unknown) => {
         console.error('[playbackService] RemoteDislike (speed) failed:', error);
      });
   });

   TrackPlayer.addEventListener(Event.RemoteSetRating, () => {
      const current = store.getState().settings.playbackSpeed;
      void applyPlaybackSpeed(getNextPlaybackSpeed(current)).catch((error: unknown) => {
         console.error('[playbackService] RemoteSetRating (speed) failed:', error);
      });
   });
}
