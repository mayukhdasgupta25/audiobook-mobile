/**
 * Prefetch the next chapter's HLS master + variant playlist before the current chapter ends.
 */

import { store } from '@/store';
import { setPlaylist } from '@/store/streaming';
import { queryKeys } from '@/constants/queryKeys';
import { queryClient } from '@/utils/queryClient';
import { getAdjacentChapter } from '@/utils/chapterNavigation';
import { fetchChapterPlaybackSource } from '@/utils/chapterStreamUrl';

export { NEXT_CHAPTER_PREFETCH_REMAINING_SEC } from '@/constants/playbackConstants';

/**
 * Fetch and cache the next chapter playlist when not already cached at the target bitrate.
 * Returns the next chapter id when prefetched or already cached; null on last chapter / failure.
 */
export async function prefetchNextChapterPlaylist(
   audiobookId: string,
   currentChapterId: string,
   userId: string,
   preferredBitrateKbps: number
): Promise<string | null> {
   const nextChapter = await getAdjacentChapter(audiobookId, currentChapterId, 1);
   if (!nextChapter) {
      return null;
   }

   const cached = store.getState().streaming.playlistsByChapterId[nextChapter.id];
   if (cached && cached.selectedBitrate === preferredBitrateKbps) {
      return nextChapter.id;
   }

   try {
      const source = await fetchChapterPlaybackSource(nextChapter.id, userId, {
         preferredBitrateKbps,
      });

      store.dispatch(
         setPlaylist({
            chapterId: nextChapter.id,
            playlistData: source.playlistData,
         })
      );

      queryClient.setQueryData(
         queryKeys.streaming.playlist(nextChapter.id, userId, preferredBitrateKbps),
         source.playlistData
      );

      return nextChapter.id;
   } catch (error: unknown) {
      console.warn('[Prefetch] Failed to prefetch next chapter playlist:', error);
      return null;
   }
}
