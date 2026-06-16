/**
 * Prefetch next chapter HLS playlist when playback enters the final ~45 seconds.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store } from '@/store';
import { usePreferredPlaybackBitrate } from '@/hooks/usePreferredPlaybackBitrate';
import {
   prefetchNextChapterPlaylist,
   NEXT_CHAPTER_PREFETCH_REMAINING_SEC,
} from '@/utils/prefetchNextChapterPlaylist';
import { getPlaybackRemainingSeconds } from '@/utils/playbackPosition';
import { shouldPauseAtChapterEnd } from '@/utils/sleepTimer';
import { isActivePlaybackSession } from '@/utils/playbackSession';
import { registerNextChapterPrefetchProgress } from '@/services/nextChapterPrefetchProgress';

export function useNextChapterPrefetch(): void {
   const audiobookId = useSelector((state: RootState) => state.player.audiobookId);
   const currentChapterId = useSelector((state: RootState) => state.player.currentChapterId);
   const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
   const chapterEndPosition = useSelector((state: RootState) => state.player.chapterEndPosition);
   const userId = useSelector((state: RootState) => state.auth.user?.id);
   const preferredBitrateKbps = usePreferredPlaybackBitrate();

   const prefetchedForChapterIdRef = useRef<string | null>(null);
   const prefetchInFlightRef = useRef(false);

   useEffect(() => {
      prefetchedForChapterIdRef.current = null;
   }, [currentChapterId]);

   const onPlaybackProgressSync = useCallback(
      (position: number, duration: number) => {
         if (!isActivePlaybackSession() || !isPlaying) {
            return;
         }
         if (!audiobookId || !currentChapterId || !userId) {
            return;
         }
         if (shouldPauseAtChapterEnd(store.getState().settings)) {
            return;
         }

         const remaining = getPlaybackRemainingSeconds(
            position,
            duration,
            chapterEndPosition
         );
         if (remaining > NEXT_CHAPTER_PREFETCH_REMAINING_SEC) {
            return;
         }
         if (prefetchedForChapterIdRef.current === currentChapterId) {
            return;
         }
         if (prefetchInFlightRef.current) {
            return;
         }

         prefetchInFlightRef.current = true;
         prefetchedForChapterIdRef.current = currentChapterId;

         void prefetchNextChapterPlaylist(
            audiobookId,
            currentChapterId,
            userId,
            preferredBitrateKbps
         ).finally(() => {
            prefetchInFlightRef.current = false;
         });
      },
      [
         audiobookId,
         currentChapterId,
         isPlaying,
         userId,
         preferredBitrateKbps,
         chapterEndPosition,
      ]
   );

   useEffect(() => {
      registerNextChapterPrefetchProgress(onPlaybackProgressSync);
      return () => registerNextChapterPrefetchProgress(null);
   }, [onPlaybackProgressSync]);
}
