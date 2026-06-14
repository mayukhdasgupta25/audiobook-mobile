import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
   getBookmarkByChapterId,
   createBookmark,
   deleteBookmark,
} from '@/services/bookmarks';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthQueryEnabled } from './useAuthQueryEnabled';
import { showToast } from '@/utils/toast';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function useBookmark(chapterId: string | null | undefined) {
   const enabled = useAuthQueryEnabled(!!chapterId);

   return useQuery({
      queryKey: queryKeys.bookmarks.byChapter(chapterId!),
      queryFn: () => getBookmarkByChapterId(chapterId!),
      enabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) return false;
         return failureCount < 2;
      },
   });
}

export function useBookmarkMutations(chapterId: string | null | undefined) {
   const queryClient = useQueryClient();
   const queryKey = chapterId
      ? queryKeys.bookmarks.byChapter(chapterId)
      : queryKeys.bookmarks.all();

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
         queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all() });
         if (chapterId) {
            queryClient.invalidateQueries({
               queryKey: queryKeys.bookmarks.byChapter(chapterId),
            });
         }
         showToast({ message: 'Bookmark saved', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   const remove = useMutation({
      mutationFn: (bookmarkId: string) => deleteBookmark(bookmarkId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all() });
         if (chapterId) {
            queryClient.invalidateQueries({
               queryKey: queryKeys.bookmarks.byChapter(chapterId),
            });
         }
         showToast({ message: 'Bookmark removed', type: 'success' });
      },
      onError: (error) => {
         showToast({ message: getApiErrorMessage(error), type: 'error' });
      },
   });

   return { add, remove, queryKey };
}
