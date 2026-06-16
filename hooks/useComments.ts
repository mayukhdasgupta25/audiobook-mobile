import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getComments,
   createComment,
   CreateCommentRequest,
} from '@/services/comments';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useComments(
   audiobookId: string,
   page: number,
   parentId?: string,
   queryEnabled = true
) {
   const enabled = useAuthQueryEnabled(!!audiobookId && queryEnabled);

   return useQuery({
      queryKey: queryKeys.audiobooks.comments(audiobookId, page, parentId),
      queryFn: () =>
         getComments({
            audiobookId,
            page,
            ...(parentId ? { parentId } : {}),
         }),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
   });
}

export function useCommentMutation(audiobookId: string) {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (request: Omit<CreateCommentRequest, 'audiobookId'>) =>
         createComment({ audiobookId, ...request }),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.audiobooks.commentsAll(audiobookId),
         });
      },
   });
}
