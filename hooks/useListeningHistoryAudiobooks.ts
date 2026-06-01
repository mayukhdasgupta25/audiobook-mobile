import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getAudiobookById, type Audiobook } from '@/services/audiobooks';
import type { ListeningHistoryEntry } from '@/services/listeningHistory';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export interface ListeningHistoryListItem {
   entry: ListeningHistoryEntry;
   audiobook?: Audiobook;
}

export function useListeningHistoryAudiobooks(entries: ListeningHistoryEntry[]) {
   const authEnabled = useAuthQueryEnabled(entries.length > 0);

   const queries = useQueries({
      queries: entries.map((entry) => ({
         queryKey: ['audiobook', entry.audiobookId] as const,
         queryFn: () => getAudiobookById(entry.audiobookId),
         enabled: authEnabled && !!entry.audiobookId && !entry.audiobook,
         staleTime: 5 * 60 * 1000,
         retry: (failureCount: number, error: unknown) => {
            if (error instanceof ApiError && error.status === 401) return false;
            return failureCount < 2;
         },
      })),
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
