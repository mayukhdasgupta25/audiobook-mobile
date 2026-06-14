import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getMoodById } from '@/services/moods';
import { queryKeys } from '@/constants/queryKeys';
import { RootState } from '@/store';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useResourceDeleted } from '@/hooks/useResourceDeleted';

export function useMood(moodId: string) {
   const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);
   const isDeleted = useResourceDeleted('moods', moodId);

   const query = useQuery({
      queryKey: queryKeys.moods.detail(moodId),
      queryFn: () => getMoodById(moodId),
      enabled: isInitialized && moodId.length > 0 && !isDeleted,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });

   const isNotFound = isDeleted || isNotFoundError(query.error);

   return {
      ...query,
      isNotFound,
   };
}
