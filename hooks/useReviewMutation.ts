import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '@/services/reviews';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';

export function useReviewMutation(audiobookId: string) {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (rating: number) =>
         createReview({ audiobookId, rating }),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.audiobooks.detail(audiobookId),
         });
      },
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 1;
      },
   });
}
