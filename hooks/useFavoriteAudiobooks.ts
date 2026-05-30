/**
 * Resolves full Audiobook data for favorite items.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getAudiobookById, Audiobook } from '@/services/audiobooks';
import { Favorite } from '@/services/favorites';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useFavoriteAudiobooks(favorites: Favorite[]) {
   const authEnabled = useAuthQueryEnabled(favorites.length > 0);

   const queries = useQueries({
      queries: favorites.map((favorite) => ({
         queryKey: ['audiobook', favorite.audiobookId] as const,
         queryFn: () => getAudiobookById(favorite.audiobookId),
         enabled: authEnabled && !!favorite.audiobookId && !favorite.audiobook,
         staleTime: 5 * 60 * 1000,
         retry: (failureCount: number, error: unknown) => {
            if (error instanceof ApiError && error.status === 401) return false;
            return failureCount < 2;
         },
      })),
   });

   const books = useMemo((): Audiobook[] => {
      const result: Audiobook[] = [];
      favorites.forEach((favorite, index) => {
         if (favorite.audiobook) {
            result.push(favorite.audiobook);
            return;
         }
         const book = queries[index]?.data?.data;
         if (book) {
            result.push(book);
         }
      });
      return result;
   }, [favorites, queries]);

   const isLoading =
      favorites.length > 0 &&
      favorites.some((favorite, index) => {
         if (favorite.audiobook) return false;
         const query = queries[index];
         return query?.isLoading || query?.isFetching;
      });

   return { books, isLoading };
}
