/**
 * TanStack Query hook for fetching audiobooks by genre with pagination
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getAudiobooksByGenre } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch audiobooks for a specific genre and page
 * @param genreId - Genre ID
 * @param page - Page number (default: 1)
 * @returns TanStack Query result with audiobooks data
 */
export function useAudiobooksByGenre(genreId: string, page = 1) {
   // Check if user is authenticated before making the query
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['audiobooks', 'genre', genreId, page],
      queryFn: () => getAudiobooksByGenre(genreId, page),
      // Only fetch if genreId is valid, user is authenticated, and auth is initialized
      enabled: !!genreId && isAuthenticated && isInitialized && page > 0,
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

