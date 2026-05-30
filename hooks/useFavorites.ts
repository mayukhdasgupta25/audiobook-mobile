import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/services/favorites';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export type FavoritesQueryKey = ['favorites', { limit?: number } | 'all'];

export function favoritesQueryKey(limit?: number): FavoritesQueryKey {
   if (limit != null) {
      return ['favorites', { limit }];
   }
   return ['favorites', 'all'];
}

export function useFavorites(limit?: number) {
   const enabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: favoritesQueryKey(limit),
      queryFn: async () => {
         const data = await getFavorites(limit != null ? { limit } : undefined);
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
