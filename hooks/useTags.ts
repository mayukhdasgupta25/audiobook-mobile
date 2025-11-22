/**
 * TanStack Query hook for fetching tags
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getTags } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch tags
 * @returns TanStack Query result with tags data
 */
export function useTags() {
   // Check if user is authenticated (tags might need auth, but API suggests no auth)
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   return useQuery({
      queryKey: ['tags'],
      queryFn: () => getTags(),
      enabled: isInitialized, // Only fetch after auth is initialized
      retry: (failureCount, error) => {
         // Don't retry on 401 (unauthorized) errors
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         // Retry up to 2 times for other errors
         return failureCount < 2;
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - tags don't change often
   });
}

