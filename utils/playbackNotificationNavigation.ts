/**
 * Opens the app from the media notification on the user's last active screen.
 */

import type { Href } from 'expo-router';
import { router } from 'expo-router';
import TrackPlayer from 'react-native-track-player';
import { store } from '@/store';
import { setMinimized, setVisible } from '@/store/player';
import { resolvePersistedPlaybackRoute } from '@/utils/playbackReturnPathStorage';

const TRACKPLAYER_NOTIFICATION_PREFIX = 'trackplayer://';

let lastOpenAt = 0;

export function isTrackPlayerNotificationUrl(url: string | null | undefined): boolean {
   return typeof url === 'string' && url.startsWith(TRACKPLAYER_NOTIFICATION_PREFIX);
}

function isHomeLikePath(path: string | undefined): boolean {
   if (!path) {
      return true;
   }
   return (
      path === '/' ||
      path === '/(tabs)' ||
      path.startsWith('/(tabs)/') ||
      path === '/index'
   );
}

async function resolveTargetRoute(): Promise<string | null> {
   const { playbackReturnPath, audiobookId } = store.getState().player;
   if (playbackReturnPath) {
      return playbackReturnPath;
   }

   const persisted = await resolvePersistedPlaybackRoute();
   if (persisted) {
      return persisted;
   }

   if (audiobookId) {
      return `/details/${audiobookId}`;
   }

   try {
      const track = await TrackPlayer.getActiveTrack();
      if (track?.album && typeof track.album === 'string') {
         return `/details/${track.album}`;
      }
   } catch {
      // Player not ready
   }

   return null;
}

function navigateToPath(path: string): void {
   router.replace(path as Href);
}

export async function openPlaybackScreenFromNotification(
   currentPathname?: string
): Promise<void> {
   const now = Date.now();
   if (now - lastOpenAt < 400) {
      return;
   }
   lastOpenAt = now;

   store.dispatch(setVisible(true));
   store.dispatch(setMinimized(false));

   const target = await resolveTargetRoute();
   if (!target) {
      if (isHomeLikePath(currentPathname)) {
         return;
      }
      navigateToPath('/(tabs)');
      return;
   }

   if (isHomeLikePath(currentPathname) || currentPathname !== target) {
      navigateToPath(target);
   }
}

export async function handlePlaybackNotificationUrl(
   url: string | null | undefined,
   currentPathname?: string
): Promise<boolean> {
   if (!isTrackPlayerNotificationUrl(url)) {
      return false;
   }
   await openPlaybackScreenFromNotification(currentPathname);
   return true;
}
