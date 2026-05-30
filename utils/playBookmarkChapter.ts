import type { Bookmark } from '@/services/bookmarks';
import type { AppDispatch } from '@/store';
import { fetchAllChapters, switchToChapter } from '@/utils/chapterNavigation';
import { getBookmarkAudiobookId } from '@/utils/bookmarkDisplay';

/**
 * Load the bookmarked chapter and start playback (same flow as tapping a chapter on details).
 */
export async function playBookmarkChapter(
   bookmark: Bookmark,
   dispatch: AppDispatch
): Promise<boolean> {
   const audiobookId = getBookmarkAudiobookId(bookmark);
   if (!audiobookId) {
      return false;
   }

   const chapters = await fetchAllChapters(audiobookId);
   const chapter = chapters.find((c) => c.id === bookmark.chapterId);
   if (!chapter) {
      return false;
   }

   await switchToChapter(dispatch, chapter, { totalChapters: chapters.length });
   return true;
}
