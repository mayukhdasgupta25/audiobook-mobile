/**
 * Helpers for resolving the most recently played chapter for Continue Listening.
 */

import {
   getChapterProgress,
   type Chapter,
   type ChapterProgress,
} from '@/services/audiobooks';

export interface ResolvedChapterProgress {
   chapterId: string;
   chapter: Chapter;
   currentPosition: number;
   lastListenedAt: string;
}

/** Pick the chapter with the latest lastListenedAt and saved progress > 0. */
export async function findMostRecentChapterProgress(
   chapters: Chapter[]
): Promise<ResolvedChapterProgress | null> {
   if (chapters.length === 0) {
      return null;
   }

   const results = await Promise.all(
      chapters.map(async (chapter) => {
         try {
            const progress = await getChapterProgress(chapter.id);
            return { chapter, progress };
         } catch {
            return { chapter, progress: null as ChapterProgress | null };
         }
      })
   );

   let best: ResolvedChapterProgress | null = null;

   for (const { chapter, progress } of results) {
      if (!progress || progress.currentPosition <= 0 || progress.completed) {
         continue;
      }

      if (
         !best ||
         new Date(progress.lastListenedAt).getTime() >
            new Date(best.lastListenedAt).getTime()
      ) {
         best = {
            chapterId: chapter.id,
            chapter,
            currentPosition: progress.currentPosition,
            lastListenedAt: progress.lastListenedAt,
         };
      }
   }

   return best;
}

export function buildContinueListeningProgress(
   elapsedSeconds: number,
   totalSeconds: number
): number {
   if (totalSeconds <= 0 || elapsedSeconds <= 0) {
      return 0;
   }
   return Math.min(1, Math.max(0, elapsedSeconds / totalSeconds));
}
