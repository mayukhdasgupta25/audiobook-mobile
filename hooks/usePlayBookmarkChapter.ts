import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import type { Bookmark } from '@/services/bookmarks';
import { playBookmarkChapter } from '@/utils/playBookmarkChapter';
import { getBookmarkAudiobookId } from '@/utils/bookmarkDisplay';

export function usePlayBookmarkChapter() {
   const dispatch = useDispatch();

   const playBookmark = useCallback(
      async (bookmark: Bookmark) => {
         try {
            const started = await playBookmarkChapter(bookmark, dispatch);
            if (!started) {
               const audiobookId = getBookmarkAudiobookId(bookmark);
               if (audiobookId) {
                  router.push(`/details/${audiobookId}` as never);
               }
            }
         } catch (error: unknown) {
            console.error('[usePlayBookmarkChapter] Failed to start playback:', error);
            const audiobookId = getBookmarkAudiobookId(bookmark);
            if (audiobookId) {
               router.push(`/details/${audiobookId}` as never);
            }
         }
      },
      [dispatch]
   );

   return { playBookmark };
}
