import type { AppDispatch } from '@/store';
import { store } from '@/store';
import { play } from '@/store/player';
import { getChapterById } from '@/services/audiobooks';
import { fetchAllChapters, switchToChapter } from '@/utils/chapterNavigation';

/**
 * Resume the continue-listening chapter in the player and start playback.
 */
export async function playContinueListeningChapter(
   audiobookId: string,
   chapterId: string,
   dispatch: AppDispatch
): Promise<boolean> {
   if (!audiobookId || !chapterId) {
      return false;
   }

   const player = store.getState().player;
   if (
      player.currentChapterId === chapterId &&
      player.audiobookId === audiobookId
   ) {
      dispatch(play());
      return true;
   }

   try {
      const chapter = await getChapterById(chapterId);
      if (chapter.audiobookId !== audiobookId) {
         return false;
      }

      const chapters = await fetchAllChapters(audiobookId);
      await switchToChapter(dispatch, chapter, { totalChapters: chapters.length });
      return true;
   } catch (error: unknown) {
      console.warn('[playContinueListeningChapter] Failed to start chapter:', error);
      return false;
   }
}
