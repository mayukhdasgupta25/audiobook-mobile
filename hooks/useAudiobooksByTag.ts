/**
 * TanStack Query hook for fetching audiobooks by tag with pagination
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getAudiobooksByTag } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch audiobooks for a specific tag and page
 * @param tagName - Tag name (e.g., "New Releases", "Trending")
 * @param page - Page number (default: 1)
 * @returns TanStack Query result with audiobooks data
 */
export function useAudiobooksByTag(tagName: string, page = 1) {
   // Check if user is authenticated before making the query
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['audiobooks', 'tag', tagName, page],
      queryFn: () => getAudiobooksByTag(tagName, page),
      // Only fetch if tagName is valid, user is authenticated, and auth is initialized
      enabled: !!tagName && isAuthenticated && isInitialized && page > 0,
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

