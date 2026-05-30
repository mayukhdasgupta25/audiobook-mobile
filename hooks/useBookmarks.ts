import { useQuery } from '@tanstack/react-query';
import { getBookmarks } from '@/services/bookmarks';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export type BookmarksQueryKey = ['bookmarks', { limit?: number } | 'all'];

export function bookmarksQueryKey(limit?: number): BookmarksQueryKey {
   if (limit != null) {
      return ['bookmarks', { limit }];
   }
   return ['bookmarks', 'all'];
}

export function useBookmarks(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: bookmarksQueryKey(limit),
      queryFn: async () => {
         const data = await getBookmarks(limit != null ? { limit } : {});
         return { data };
      },
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });
}
