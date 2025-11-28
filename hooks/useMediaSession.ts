/**
 * Media Session Hook
 * Manages lock screen media controls and now playing info
 * Works with react-native-video's built-in media session support
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform, NativeModules } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { play, pause } from '@/store/player';
import { apiConfig } from '@/services/api';

const { MediaSession } = NativeModules;

/**
 * Hook to manage media session for lock screen controls
 * Updates now playing info and handles remote control events
 */
export function useMediaSession() {
   const dispatch = useDispatch();
   const {
      isPlaying,
      playbackPosition,
      totalDuration,
      chapterMetadata,
   } = useSelector((state: RootState) => state.player);

   const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

   /**
    * Update now playing info for lock screen
    * Calls native module to update MPNowPlayingInfoCenter (iOS) or MediaSession (Android)
    */
   const updateNowPlayingInfo = useCallback(() => {
      if (!chapterMetadata) return;

      // Get cover image URL
      const artworkUrl = chapterMetadata.coverImage
         ? `${apiConfig.baseURL}${chapterMetadata.coverImage}`
         : undefined;

      const info = {
         title: chapterMetadata.title || 'Unknown Chapter',
         artist: 'AudioBook',
         artwork: artworkUrl,
         duration: totalDuration,
         elapsedTime: playbackPosition,
         isPlaying: isPlaying,
      };

      // Update native now playing info
      if (Platform.OS === 'ios' && MediaSession) {
         MediaSession.updateNowPlaying(info).catch((error: Error) => {
            console.warn('[MediaSession] Failed to update now playing info:', error);
         });
      }
      // Android: react-native-video handles this automatically

      return info;
   }, [chapterMetadata, totalDuration, playbackPosition, isPlaying]);

   /**
    * Handle remote control events
    * These will be handled by native code and forwarded to Redux
    */
   const handleRemotePlay = useCallback(() => {
      dispatch(play());
   }, [dispatch]);

   const handleRemotePause = useCallback(() => {
      dispatch(pause());
   }, [dispatch]);

   const handleRemoteSeek = useCallback(
      (seconds: number) => {
         // This will be handled by the native bridge
         // For now, we'll use the existing handleSeek from useAudioPlayer
         console.log('[Media Session] Remote seek:', seconds);
      },
      []
   );

   // Update now playing info periodically to keep lock screen in sync
   useEffect(() => {
      if (isPlaying && chapterMetadata) {
         // Update every second to keep position in sync
         updateIntervalRef.current = setInterval(() => {
            updateNowPlayingInfo();
         }, 1000);
      } else {
         if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
         }
      }

      return () => {
         if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
         }
      };
   }, [isPlaying, chapterMetadata, updateNowPlayingInfo]);

   // Update now playing info when metadata changes
   useEffect(() => {
      if (chapterMetadata) {
         updateNowPlayingInfo();
      }
   }, [chapterMetadata, updateNowPlayingInfo]);

   return {
      nowPlayingInfo: updateNowPlayingInfo(),
      handleRemotePlay,
      handleRemotePause,
      handleRemoteSeek,
   };
}

