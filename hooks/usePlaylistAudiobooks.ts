/**
 * Resolves full Audiobook data for playlist items.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Audiobook } from '@/services/audiobooks';
import { PlaylistItem } from '@/services/playlists';
import { createAudiobookDetailQueryOptions } from '@/utils/audiobookDetailQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useDeletedResourcesRevision } from './useResourceDeleted';

export function usePlaylistAudiobooks(items: PlaylistItem[]) {
   const authEnabled = useAuthQueryEnabled(items.length > 0);
   useDeletedResourcesRevision();

   const queries = useQueries({
      queries: items.map((item) =>
         createAudiobookDetailQueryOptions(
            item.audiobookId,
            authEnabled && !!item.audiobookId && !item.audiobook
         )
      ),
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
