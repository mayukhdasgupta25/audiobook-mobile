/**
 * Persist chapter playback progress to the backend and invalidate local caches.
 */

import { queryKeys } from '@/constants/queryKeys';
import { syncPlayback, updateChapterProgress } from '@/services/audiobooks';
import { store } from '@/store';
import { clampSyncPlaybackPosition } from '@/utils/playbackPosition';

async function invalidatePlaybackQueries(
   audiobookId: string,
   chapterId: string
): Promise<void> {
   const { queryClient } = await import('@/utils/queryClient');
   const userProfileId = store.getState().auth.userProfile?.id;

   void queryClient.invalidateQueries({
      queryKey: queryKeys.playback.chapterProgress(chapterId),
   });
   void queryClient.invalidateQueries({
      queryKey: queryKeys.playback.continueListening(audiobookId),
   });
   void queryClient.invalidateQueries({
      queryKey: queryKeys.userAudiobooks.me(),
   });

   if (userProfileId) {
      void queryClient.invalidateQueries({
         queryKey: queryKeys.playback.listeningHistory(userProfileId),
      });
   }
}

export interface SaveChapterPlaybackProgressOptions {
   completed?: boolean;
}

/** Save in-progress or completed chapter position (seek sync + PUT progress). */
export async function saveChapterPlaybackProgress(
   audiobookId: string,
   chapterId: string,
   position: number,
   durationSeconds: number,
   options?: SaveChapterPlaybackProgressOptions
): Promise<void> {
   const chapterEndPosition = store.getState().player.chapterEndPosition;
   const clampedPosition = clampSyncPlaybackPosition(
      position,
      durationSeconds > 0 ? durationSeconds : position,
      'seek',
      chapterEndPosition
   );
   const completed = options?.completed ?? false;

   if (durationSeconds > 0) {
      await syncPlayback({
         audiobookId,
         chapterId,
         action: 'seek',
         position: clampedPosition,
         durationSeconds,
      }).catch((error: unknown) => {
         console.warn('[saveChapterPlaybackProgress] syncPlayback failed:', error);
      });
   }

   await updateChapterProgress(chapterId, {
      currentPosition: clampedPosition,
      completed,
   }).catch((error: unknown) => {
      console.warn('[saveChapterPlaybackProgress] updateChapterProgress failed:', error);
   });

   await invalidatePlaybackQueries(audiobookId, chapterId);
}

export async function markChapterCompletedAtEnd(
   audiobookId: string,
   chapterId: string,
   position: number,
   durationSeconds: number
): Promise<void> {
   if (durationSeconds <= 0) {
      return;
   }

   await saveChapterPlaybackProgress(audiobookId, chapterId, position, durationSeconds, {
      completed: true,
   });
}
