import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getFavoriteByAudiobookId,
   createFavorite,
   deleteFavorite,
} from '@/services/favorites';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useFavorite(audiobookId: string) {
   const enabled = useAuthQueryEnabled(!!audiobookId);

   return useQuery({
      queryKey: ['favorite', audiobookId],
      queryFn: () => getFavoriteByAudiobookId(audiobookId),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });
}

export function useFavoriteMutations(audiobookId: string) {
   const queryClient = useQueryClient();

   const add = useMutation({
      mutationFn: () => createFavorite({ audiobookId }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['favorites'] });
         queryClient.invalidateQueries({ queryKey: ['favorite', audiobookId] });
      },
   });

   const remove = useMutation({
      mutationFn: (favoriteId: string) => deleteFavorite(favoriteId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['favorites'] });
         queryClient.invalidateQueries({ queryKey: ['favorite', audiobookId] });
      },
   });

   return { add, remove };
}
