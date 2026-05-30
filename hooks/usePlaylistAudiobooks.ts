/**
 * Resolves full Audiobook data for playlist items.
 * The items API often returns only audiobookId without an embedded audiobook.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getAudiobookById, Audiobook } from '@/services/audiobooks';
import { PlaylistItem } from '@/services/playlists';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function usePlaylistAudiobooks(items: PlaylistItem[]) {
   const authEnabled = useAuthQueryEnabled(items.length > 0);

   const queries = useQueries({
      queries: items.map((item) => ({
         queryKey: ['audiobook', item.audiobookId] as const,
         queryFn: () => getAudiobookById(item.audiobookId),
         enabled: authEnabled && !!item.audiobookId && !item.audiobook,
         staleTime: 5 * 60 * 1000,
         retry: (failureCount: number, error: unknown) => {
            if (error instanceof ApiError && error.status === 401) return false;
            return failureCount < 2;
         },
      })),
   });

   const books = useMemo((): Audiobook[] => {
      const result: Audiobook[] = [];
      items.forEach((item, index) => {
         if (item.audiobook) {
            result.push(item.audiobook);
            return;
         }
         const book = queries[index]?.data?.data;
         if (book) {
            result.push(book);
         }
      });
      return result;
   }, [items, queries]);

   const isLoading =
      items.length > 0 &&
      items.some((item, index) => {
         if (item.audiobook) return false;
         const query = queries[index];
         return query?.isLoading || query?.isFetching;
      });

   return { books, isLoading };
}
