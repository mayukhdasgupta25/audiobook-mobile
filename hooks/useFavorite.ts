import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getFavoriteByAudiobookId,
   createFavorite,
   deleteFavorite,
} from '@/services/favorites';
import { queryKeys } from '@/constants/queryKeys';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { useResourceDeleted } from './useResourceDeleted';
import { showToast } from '@/utils/toast';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function useFavorite(audiobookId: string) {
   const isDeleted = useResourceDeleted('audiobooks', audiobookId);
   const enabled = useAuthQueryEnabled(!!audiobookId && !isDeleted);

   return useQuery({
      queryKey: queryKeys.favorites.byAudiobook(audiobookId),
      queryFn: () => getFavoriteByAudiobookId(audiobookId),
      enabled,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });
}

export function useFavoriteMutations(audiobookId: string) {
   const queryClient = useQueryClient();

   const add = useMutation({
      mutationFn: () => createFavorite({ audiobookId }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all() });
         queryClient.invalidateQueries({
            queryKey: queryKeys.favorites.byAudiobook(audiobookId),
         });
         showToast({ message: 'Added to favorites', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   const remove = useMutation({
      mutationFn: (favoriteId: string) => deleteFavorite(favoriteId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all() });
         queryClient.invalidateQueries({
            queryKey: queryKeys.favorites.byAudiobook(audiobookId),
         });
         showToast({ message: 'Removed from favorites', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   return { add, remove };
}
