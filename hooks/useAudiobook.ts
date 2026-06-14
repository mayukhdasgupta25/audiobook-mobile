/**
 * TanStack Query hook for fetching a single audiobook by ID
 */

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { queryKeys } from '@/constants/queryKeys';
import { RootState } from '@/store';
import { createAudiobookDetailQueryOptions } from '@/utils/audiobookDetailQuery';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { useResourceDeleted } from '@/hooks/useResourceDeleted';

/**
 * Hook to fetch a single audiobook by ID
 * @param audiobookId - Audiobook ID
 */
export function useAudiobook(audiobookId: string) {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const isDeleted = useResourceDeleted('audiobooks', audiobookId);

   const query = useQuery({
      ...createAudiobookDetailQueryOptions(
         audiobookId,
         !!audiobookId && isAuthenticated && isInitialized && !isDeleted
      ),
      queryKey: queryKeys.audiobooks.detail(audiobookId),
   });

   const isNotFound = isDeleted || isNotFoundError(query.error);

   return {
      ...query,
      isNotFound,
   };
}
