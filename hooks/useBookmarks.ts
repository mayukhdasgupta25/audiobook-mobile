import { useQuery } from '@tanstack/react-query';
import { getBookmarks } from '@/services/bookmarks';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useBookmarks(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: queryKeys.bookmarks.me(limit),
      queryFn: async () => {
         const data = await getBookmarks(limit != null ? { limit } : {});
         return { data };
      },
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
   });
}
