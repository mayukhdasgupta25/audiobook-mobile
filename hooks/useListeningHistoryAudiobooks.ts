import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { type Audiobook } from '@/services/audiobooks';
import type { ListeningHistoryEntry } from '@/services/listeningHistory';
import { createAudiobookDetailQueryOptions } from '@/utils/audiobookDetailQuery';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useDeletedResourcesRevision } from './useResourceDeleted';

export interface ListeningHistoryListItem {
   entry: ListeningHistoryEntry;
   audiobook?: Audiobook;
}

export function useListeningHistoryAudiobooks(entries: ListeningHistoryEntry[]) {
   const authEnabled = useAuthQueryEnabled(entries.length > 0);
   useDeletedResourcesRevision();

   const queries = useQueries({
      queries: entries.map((entry) =>
         createAudiobookDetailQueryOptions(
            entry.audiobookId,
            authEnabled && !!entry.audiobookId && !entry.audiobook
         )
      ),
   });

   const items = useMemo((): ListeningHistoryListItem[] => {
      return entries.map((entry, index) => {
         const audiobook =
            entry.audiobook ?? queries[index]?.data?.data ?? undefined;
         return { entry, audiobook };
      });
   }, [entries, queries]);

   const isLoading =
      entries.length > 0 &&
      entries.some((entry, index) => {
         if (entry.audiobook) return false;
         const query = queries[index];
         return query?.isLoading || query?.isFetching;
      });

   return { items, isLoading };
}
