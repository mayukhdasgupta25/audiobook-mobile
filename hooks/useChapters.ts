/**
 * TanStack Query hook for fetching chapters with pagination
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getChapters } from '@/services/audiobooks';
import { queryKeys } from '@/constants/queryKeys';
import { RootState } from '@/store';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useResourceDeleted } from '@/hooks/useResourceDeleted';

export function useChapters(audiobookId: string, page = 1) {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const isDeleted = useResourceDeleted('audiobooks', audiobookId);

   return useQuery({
      queryKey: queryKeys.audiobooks.chapters(audiobookId, page),
      queryFn: () => getChapters(audiobookId, page),
      enabled:
         !!audiobookId &&
         isAuthenticated &&
         isInitialized &&
         page > 0 &&
         !isDeleted,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });
}
