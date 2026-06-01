/**
 * Fetches GET /chapters/:chapterId for the playing chapter and stores endPosition in Redux.
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setChapterEndPosition, setPosition } from '@/store/player';
import { getChapterById } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { store } from '@/store';
import { clampPlaybackSeekSeconds } from '@/utils/playbackPosition';

export function usePlayingChapterBounds(): void {
   const dispatch = useDispatch();
   const chapterId = useSelector((state: RootState) => state.player.currentChapterId);
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   const { data: chapter } = useQuery({
      queryKey: ['chapter', chapterId],
      queryFn: () => getChapterById(chapterId!),
      enabled: !!chapterId && isAuthenticated && isInitialized,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
   });

   useEffect(() => {
      if (!chapterId) {
         dispatch(setChapterEndPosition(null));
         return;
      }

      if (chapter?.endPosition != null && chapter.endPosition > 0) {
         dispatch(setChapterEndPosition(chapter.endPosition));

         const player = store.getState().player;
         if (player.currentChapterId !== chapterId || player.totalDuration <= 0) {
            return;
         }

         const capped = clampPlaybackSeekSeconds(
            player.playbackPosition,
            player.totalDuration,
            chapter.endPosition
         );
         if (capped < player.playbackPosition - 0.25) {
            dispatch(setPosition(capped));
         }
      }
   }, [chapter, chapterId, dispatch]);
}
