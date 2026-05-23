/**
 * Fetch per-chapter listening progress for the details screen chapter list.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getChapterProgress } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

const STALE_TIME_MS = 60_000;

export function useChaptersProgress(
   chapterIds: string[],
   enabled = true
): Record<string, number> {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const currentChapterId = useSelector(
      (state: RootState) => state.player.currentChapterId
   );
   const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
   const isPlayerVisible = useSelector((state: RootState) => state.player.isVisible);

   const shouldFetch = enabled && isAuthenticated && isInitialized && chapterIds.length > 0;

   const queries = useQueries({
      queries: chapterIds.map((chapterId) => {
         const isActiveChapter = chapterId === currentChapterId;
         const useLiveProgress = isActiveChapter && (isPlaying || isPlayerVisible);

         return {
            queryKey: ['chapterProgress', chapterId] as const,
            queryFn: async () => {
               const progress = await getChapterProgress(chapterId);
               return progress?.currentPosition ?? 0;
            },
            enabled: shouldFetch && !useLiveProgress,
            staleTime: STALE_TIME_MS,
            retry: (failureCount: number, error: unknown) => {
               if (error instanceof ApiError && error.status === 404) {
                  return false;
               }
               return failureCount < 2;
            },
         };
      }),
   });

   return useMemo(() => {
      const map: Record<string, number> = {};
      chapterIds.forEach((chapterId, index) => {
         const result = queries[index];
         if (result?.data != null) {
            map[chapterId] = result.data;
         }
      });
      return map;
   }, [chapterIds, queries]);
}
