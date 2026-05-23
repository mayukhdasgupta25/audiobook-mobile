/**
 * Remembers the screen the user was on while audio is playing (Redux + AsyncStorage).
 */

import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setPlaybackReturnPath } from '@/store/player';
import {
   persistPlaybackAudiobookId,
   persistPlaybackReturnPath,
} from '@/utils/playbackReturnPathStorage';

export function usePlaybackReturnPathTracker(): void {
   const pathname = usePathname();
   const dispatch = useDispatch();
   const currentChapterId = useSelector((state: RootState) => state.player.currentChapterId);
   const audiobookId = useSelector((state: RootState) => state.player.audiobookId);

   useEffect(() => {
      if (!currentChapterId || !pathname) {
         return;
      }
      if (pathname.startsWith('/trackplayer')) {
         return;
      }
      dispatch(setPlaybackReturnPath(pathname));
      void persistPlaybackReturnPath(pathname);
   }, [pathname, currentChapterId, dispatch]);

   useEffect(() => {
      if (audiobookId) {
         void persistPlaybackAudiobookId(audiobookId);
      }
   }, [audiobookId]);
}
