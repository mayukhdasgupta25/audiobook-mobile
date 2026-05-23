/**
 * Rewrite RNTP notification taps to the last active screen (from AsyncStorage).
 */

import { resolvePersistedPlaybackRoute } from '@/utils/playbackReturnPathStorage';

export async function redirectSystemPath({
   path,
}: {
   path: string;
   initial: boolean;
}): Promise<string> {
   if (typeof path === 'string' && path.includes('notification.click')) {
      const returnRoute = await resolvePersistedPlaybackRoute();
      if (returnRoute) {
         return returnRoute;
      }
      return '/(tabs)';
   }
   return path;
}
