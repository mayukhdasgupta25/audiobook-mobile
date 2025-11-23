/**
 * TanStack Query hook for fetching a single audiobook by ID
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getAudiobookById } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch a single audiobook by ID
 * @param audiobookId - Audiobook ID
 * @returns TanStack Query result with audiobook data
 */
export function useAudiobook(audiobookId: string) {
   // Check if user is authenticated before making the query
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['audiobook', audiobookId],
      queryFn: () => getAudiobookById(audiobookId),
      // Only fetch if audiobookId is valid, user is authenticated, and auth is initialized
      enabled: !!audiobookId && isAuthenticated && isInitialized,
      retry: (failureCount, error) => {
         // Don't retry on 401 (unauthorized) errors
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         // Retry up to 2 times for other errors
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - same as global config
   });
}

