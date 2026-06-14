/**
 * Open a chapter for playback with resume position from the backend.
 */

import type { AppDispatch } from '@/store';
import { setChapter, play, setTotalDuration } from '@/store/player';
import { type Chapter } from '@/services/audiobooks';
import type { ChapterMetadata } from '@/store/player';
import { resolveChapterResumePosition } from '@/utils/chapterResumePosition';
import { resolveChapterImagePath } from '@/utils/imageAssets';
import {
   persistPlaybackAudiobookId,
   persistPlaybackChapterId,
   persistPlaybackReturnPath,
} from '@/utils/playbackReturnPathStorage';

export function chapterToMetadata(
   chapter: Chapter,
   options?: { totalChapters?: number }
): ChapterMetadata {
   return {
      id: chapter.id,
      title: chapter.title,
      coverImage: chapter.coverImage,
      maximizedChapterCoverImage:
         resolveChapterImagePath(chapter, 'playerMaximized') ?? null,
      minimizedChapterCoverImage:
         resolveChapterImagePath(chapter, 'playerMinimized') ?? null,
      chapterNumber: chapter.chapterNumber,
      totalChapters: options?.totalChapters,
      audiobookTitle: chapter.audiobook?.title,
   };
}

export interface OpenChapterOptions {
   chapter: Chapter;
   dispatch: AppDispatch;
   totalDurationSeconds?: number;
   totalChapters?: number;
   autoPlay?: boolean;
   /** Skip saved progress and start at 0 (e.g. auto-advance to next chapter). */
   startFromBeginning?: boolean;
}

/**
 * Fetch progress, set chapter in Redux, optionally set duration and start playback.
 */
export async function openChapterForPlayback({
   chapter,
   dispatch,
   totalDurationSeconds,
   totalChapters,
   autoPlay = true,
   startFromBeginning = false,
}: OpenChapterOptions): Promise<number> {
   const resumePosition = await resolveChapterResumePosition(chapter.id, {
      startFromBeginning,
      totalDurationSeconds,
   });

   const detailsPath = `/details/${chapter.audiobookId}`;

   dispatch(
      setChapter({
         chapterId: chapter.id,
         metadata: chapterToMetadata(chapter, { totalChapters }),
         audiobookId: chapter.audiobookId,
         resumePosition,
      })
   );

   void persistPlaybackReturnPath(detailsPath);
   void persistPlaybackAudiobookId(chapter.audiobookId);
   void persistPlaybackChapterId(chapter.id);

   if (totalDurationSeconds != null && totalDurationSeconds > 0) {
      dispatch(setTotalDuration(totalDurationSeconds));
   }

   if (autoPlay) {
      dispatch(play());
   }

   return resumePosition;
}
