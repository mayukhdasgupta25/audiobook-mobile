/**
 * Apply persisted playback speed to TrackPlayer, now-playing metadata, and RNTP options.
 */

import TrackPlayer from 'react-native-track-player';
import { store } from '@/store';
import { setPlaybackSpeed } from '@/store/settings';
import type { PlaybackSpeed } from '@/constants/playbackSpeed';
import { formatPlaybackSpeedLabel } from '@/constants/playbackSpeed';
import { updateTrackPlayerOptions } from '@/services/trackPlayerSetup';

function buildNowPlayingArtistLine(speed: PlaybackSpeed): string {
   const playerState = store.getState().player;
   const meta = playerState.chapterMetadata;
   const parts: string[] = [];

   if (meta?.audiobookTitle) {
      parts.push(meta.audiobookTitle);
   }
   parts.push(formatPlaybackSpeedLabel(speed));

   return parts.join(' · ');
}

export async function syncNowPlayingSpeedMetadata(speed: PlaybackSpeed): Promise<void> {
   const playerState = store.getState().player;
   if (!playerState.currentChapterId || !playerState.chapterMetadata) {
      return;
   }

   const meta = playerState.chapterMetadata;

   try {
      await TrackPlayer.updateNowPlayingMetadata({
         title: meta.title || 'Chapter',
         artist: buildNowPlayingArtistLine(speed),
      });
   } catch (error: unknown) {
      console.warn('[applyPlaybackSpeed] Failed to update now playing metadata:', error);
   }
}

export async function applyPlaybackSpeed(speed: PlaybackSpeed): Promise<void> {
   store.dispatch(setPlaybackSpeed(speed));

   const { currentChapterId } = store.getState().player;
   const skipDurationSeconds = store.getState().settings.skipDurationSeconds;

   if (currentChapterId) {
      try {
         await TrackPlayer.setRate(speed);
      } catch (error: unknown) {
         console.warn('[applyPlaybackSpeed] setRate failed:', error);
      }
      await syncNowPlayingSpeedMetadata(speed);
   }

   try {
      await updateTrackPlayerOptions(skipDurationSeconds, speed);
   } catch (error: unknown) {
      console.warn('[applyPlaybackSpeed] updateTrackPlayerOptions failed:', error);
   }
}
