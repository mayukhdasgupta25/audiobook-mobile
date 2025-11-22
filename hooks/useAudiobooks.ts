/**
 * TanStack Query hook for fetching audiobooks
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getAudiobooks } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch audiobooks for a specific page
 * @param page - Page number to fetch (default: 1)
 * @returns TanStack Query result with audiobooks data
 */
export function useAudiobooks(page = 1) {
   // Check if user is authenticated before making the query
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['audiobooks', page],
      queryFn: () => getAudiobooks(page),
      // Only fetch if page is valid, user is authenticated, and auth is initialized
      enabled: page > 0 && isAuthenticated && isInitialized,
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

