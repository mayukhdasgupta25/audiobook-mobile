import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/services/favorites';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useFavorites(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: queryKeys.favorites.me(limit),
      queryFn: async () => {
         const data = await getFavorites(limit != null ? { limit } : undefined);
         return { data };
      },
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
   });
}
