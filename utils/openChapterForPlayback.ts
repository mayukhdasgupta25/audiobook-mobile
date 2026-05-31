/**
 * Open a chapter for playback with resume position from the backend.
 */

import type { AppDispatch } from '@/store';
import { setChapter, play, setTotalDuration } from '@/store/player';
import { getChapterProgress, type Chapter } from '@/services/audiobooks';
import type { ChapterMetadata } from '@/store/player';
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
      maximizedChapterCoverImage: chapter.maximizedChapterCoverImage || null,
      minimizedChapterCoverImage: chapter.minimizedChapterCoverImage || null,
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
}: OpenChapterOptions): Promise<number> {
   let resumePosition = 0;
   try {
      const progress = await getChapterProgress(chapter.id);
      resumePosition = Math.max(0, progress?.currentPosition ?? 0);
   } catch (error: unknown) {
      console.warn('[openChapterForPlayback] Failed to fetch progress, starting at 0:', error);
   }

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
