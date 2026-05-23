/**
 * Chapter navigation — auto-advance, lock screen next/prev, in-app controls.
 */

import type { AppDispatch } from '@/store';
import { stop } from '@/store/player';
import { getChapters, syncPlayback, type Chapter } from '@/services/audiobooks';
import { openChapterForPlayback } from '@/utils/openChapterForPlayback';
import { requestChapterReload } from '@/services/playbackReload';

export async function fetchAllChapters(audiobookId: string): Promise<Chapter[]> {
   let allChapters: Chapter[] = [];
   let page = 1;
   let hasNextPage = true;

   while (hasNextPage) {
      const response = await getChapters(audiobookId, page);
      allChapters.push(...response.data);

      if (response.pagination) {
         hasNextPage = response.pagination.hasNextPage;
         page++;
      } else {
         hasNextPage = false;
      }
   }

   allChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
   return allChapters;
}

export async function getAdjacentChapter(
   audiobookId: string,
   currentChapterId: string,
   offset: 1 | -1
): Promise<Chapter | null> {
   const allChapters = await fetchAllChapters(audiobookId);
   const current = allChapters.find((c) => c.id === currentChapterId);
   if (!current) {
      return null;
   }
   return allChapters.find((c) => c.chapterNumber === current.chapterNumber + offset) ?? null;
}

export async function switchToChapter(
   dispatch: AppDispatch,
   chapter: Chapter,
   options?: { onChapterSwitched?: (chapterId: string) => void }
): Promise<void> {
   await openChapterForPlayback({
      chapter,
      dispatch,
      autoPlay: true,
   });
   requestChapterReload();
   options?.onChapterSwitched?.(chapter.id);
}

export interface AdvanceToNextChapterParams {
   dispatch: AppDispatch;
   audiobookId: string;
   currentChapterId: string;
   isVisible: boolean;
   totalDuration: number;
   onChapterSwitched?: (chapterId: string) => void;
}

export async function advanceToNextChapter(params: AdvanceToNextChapterParams): Promise<void> {
   const { dispatch, audiobookId, currentChapterId, isVisible, totalDuration, onChapterSwitched } =
      params;

   try {
      const nextChapter = await getAdjacentChapter(audiobookId, currentChapterId, 1);

      if (nextChapter) {
         await switchToChapter(dispatch, nextChapter, { onChapterSwitched });
         return;
      }

      if (isVisible) {
         await syncPlayback({
            audiobookId,
            chapterId: currentChapterId,
            action: 'pause',
            position: totalDuration,
         }).catch((error: unknown) => {
            console.error('[Chapter Navigation] Failed to sync at end:', error);
         });
      }
      dispatch(stop());
   } catch (error) {
      console.error('[Chapter Navigation] Error advancing:', error);
      if (isVisible) {
         await syncPlayback({
            audiobookId,
            chapterId: currentChapterId,
            action: 'pause',
            position: totalDuration,
         }).catch(() => undefined);
      }
      dispatch(stop());
   }
}

export async function skipToNextChapterRemote(
   dispatch: AppDispatch,
   audiobookId: string,
   currentChapterId: string,
   onChapterSwitched?: (chapterId: string) => void
): Promise<void> {
   const next = await getAdjacentChapter(audiobookId, currentChapterId, 1);
   if (next) {
      await switchToChapter(dispatch, next, { onChapterSwitched });
   }
}

export async function skipToPreviousChapterRemote(
   dispatch: AppDispatch,
   audiobookId: string,
   currentChapterId: string,
   onChapterSwitched?: (chapterId: string) => void
): Promise<void> {
   const prev = await getAdjacentChapter(audiobookId, currentChapterId, -1);
   if (prev) {
      await switchToChapter(dispatch, prev, { onChapterSwitched });
   }
}
