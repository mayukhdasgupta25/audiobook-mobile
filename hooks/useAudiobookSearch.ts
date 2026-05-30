import { useQuery } from '@tanstack/react-query';
import { searchAudiobooks } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

const MIN_QUERY_LENGTH = 2;

export function useAudiobookSearch(query: string) {
   const trimmed = query.trim();
   const enabled = useAuthQueryEnabled(trimmed.length >= MIN_QUERY_LENGTH);

   return useQuery({
      queryKey: ['audiobookSearch', trimmed],
      queryFn: () => searchAudiobooks(trimmed),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 30 * 1000,
   });
}
