/**
 * React Native Track Player playback service — lock screen / notification remote events.
 */

import TrackPlayer, { Event } from 'react-native-track-player';
import { store } from '@/store';
import { play, pause } from '@/store/player';
import {
   seekToTime,
   seekBy,
   skipToNextChapter,
   skipToPreviousChapter,
} from '@/services/trackPlayerController';

module.exports = async function playbackService() {
   TrackPlayer.addEventListener(Event.RemotePlay, () => {
      store.dispatch(play());
   });

   TrackPlayer.addEventListener(Event.RemotePause, () => {
      store.dispatch(pause());
   });

   TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
      if (event.position != null) {
         seekToTime(event.position);
      }
   });

   TrackPlayer.addEventListener(Event.RemoteJumpForward, () => {
      const seconds = store.getState().settings.skipDurationSeconds;
      seekBy(seconds);
   });

   TrackPlayer.addEventListener(Event.RemoteJumpBackward, () => {
      const seconds = store.getState().settings.skipDurationSeconds;
      seekBy(-seconds);
   });

   TrackPlayer.addEventListener(Event.RemoteNext, () => {
      void skipToNextChapter();
   });

   TrackPlayer.addEventListener(Event.RemotePrevious, () => {
      void skipToPreviousChapter();
   });
};
