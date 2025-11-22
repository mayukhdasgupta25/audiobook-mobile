/**
 * TanStack Query hook for fetching genres
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getGenres } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch genres
 * @returns TanStack Query result with genres data
 */
export function useGenres() {
   // Check if user is authenticated (genres might need auth, but API suggests no auth)
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['genres'],
      queryFn: () => getGenres(),
      enabled: isInitialized, // Only fetch after auth is initialized
      retry: (failureCount, error) => {
         // Don't retry on 401 (unauthorized) errors
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         // Retry up to 2 times for other errors
         return failureCount < 2;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - genres don't change often
   });
}

