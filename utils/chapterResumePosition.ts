/**
 * Resolve whether a chapter should start from the beginning or resume saved progress.
 */

import {
   getChapterProgress,
   type ChapterProgress,
} from '@/services/audiobooks';
import { getMaxSeekableSeconds } from '@/utils/playbackPosition';

/** Position at or above this fraction of seekable duration is treated as chapter ended. */
const NEAR_END_PROGRESS_RATIO = 0.95;

export interface ResolveChapterResumePositionOptions {
   startFromBeginning?: boolean;
   totalDurationSeconds?: number;
}

export function shouldStartChapterFromBeginning(
   progress: ChapterProgress | null,
   totalDurationSeconds?: number
): boolean {
   if (!progress) {
      return false;
   }
   if (progress.completed) {
      return true;
   }
   if (
      totalDurationSeconds != null &&
      totalDurationSeconds > 0 &&
      progress.currentPosition > 0
   ) {
      const maxSeek = getMaxSeekableSeconds(totalDurationSeconds);
      if (maxSeek > 0 && progress.currentPosition >= maxSeek * NEAR_END_PROGRESS_RATIO) {
         return true;
      }
   }
   return false;
}

export async function resolveChapterResumePosition(
   chapterId: string,
   options?: ResolveChapterResumePositionOptions
): Promise<number> {
   if (options?.startFromBeginning) {
      return 0;
   }

   try {
      const progress = await getChapterProgress(chapterId);
      if (shouldStartChapterFromBeginning(progress, options?.totalDurationSeconds)) {
         return 0;
      }
      return Math.max(0, progress?.currentPosition ?? 0);
   } catch (error: unknown) {
      console.warn('[chapterResumePosition] Failed to fetch progress, starting at 0:', error);
      return 0;
   }
}
