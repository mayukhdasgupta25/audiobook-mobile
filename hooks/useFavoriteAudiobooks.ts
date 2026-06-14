/**
 * Resolves full Audiobook data for favorite items.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Audiobook } from '@/services/audiobooks';
import { Favorite } from '@/services/favorites';
import { createAudiobookDetailQueryOptions } from '@/utils/audiobookDetailQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useDeletedResourcesRevision } from './useResourceDeleted';

export function useFavoriteAudiobooks(favorites: Favorite[]) {
   const authEnabled = useAuthQueryEnabled(favorites.length > 0);
   useDeletedResourcesRevision();

   const queries = useQueries({
      queries: favorites.map((favorite) =>
         createAudiobookDetailQueryOptions(
            favorite.audiobookId,
            authEnabled && !!favorite.audiobookId && !favorite.audiobook
         )
      ),
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
