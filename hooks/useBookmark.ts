import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getBookmarkByChapterId,
   createBookmark,
   deleteBookmark,
} from '@/services/bookmarks';
import { ApiError } from '@/services/api';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';

export function useBookmark(chapterId: string | null | undefined) {
   const enabled = useAuthQueryEnabled(!!chapterId);

   return useQuery({
      queryKey: ['bookmark', chapterId],
      queryFn: () => getBookmarkByChapterId(chapterId!),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });
}

export function useBookmarkMutations(chapterId: string | null | undefined) {
   const queryClient = useQueryClient();
   const queryKey = ['bookmark', chapterId] as const;

   const add = useMutation({
      mutationFn: async () => {
         if (!chapterId) {
            throw new Error('No chapter selected');
         }
         try {
            await createBookmark({ chapterId });
         } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
               await getBookmarkByChapterId(chapterId);
               return;
            }
            throw error;
         }
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
         if (chapterId) {
            queryClient.invalidateQueries({ queryKey: ['bookmark', chapterId] });
         }
      },
   });

   const remove = useMutation({
      mutationFn: (bookmarkId: string) => deleteBookmark(bookmarkId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
         if (chapterId) {
            queryClient.invalidateQueries({ queryKey: ['bookmark', chapterId] });
         }
      },
   });

   return { add, remove, queryKey };
}
