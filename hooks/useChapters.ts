/**
 * TanStack Query hook for fetching chapters with pagination
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getChapters } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch chapters for a specific audiobook and page
 * @param audiobookId - Audiobook ID
 * @param page - Page number (default: 1)
 * @returns TanStack Query result with chapters data
 */
export function useChapters(audiobookId: string, page = 1) {
   // Check if user is authenticated before making the query
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['chapters', audiobookId, page],
      queryFn: () => getChapters(audiobookId, page),
      // Only fetch if audiobookId is valid, user is authenticated, and auth is initialized
      enabled: !!audiobookId && isAuthenticated && isInitialized && page > 0,
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

