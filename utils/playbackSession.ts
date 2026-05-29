/**
 * Whether Redux/TrackPlayer should drive player state (authenticated + chapter loaded).
 */

import { store } from '@/store';

export function isActivePlaybackSession(): boolean {
   const { auth, player } = store.getState();
   return Boolean(
      auth.isAuthenticated && auth.accessToken && player.currentChapterId
   );
}
