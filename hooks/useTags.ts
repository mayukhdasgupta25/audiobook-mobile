/**
 * TanStack Query hook for fetching tags
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getTags } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
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
      queryKey: queryKeys.tags.all(),
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
   });
}

