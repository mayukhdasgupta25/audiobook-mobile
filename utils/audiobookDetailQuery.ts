import { ApiError } from '@/services/api';
import { getAudiobookById } from '@/services/audiobooks';
import { queryKeys } from '@/constants/queryKeys';
import {
   isResourceDeleted,
   markResourceDeleted,
} from '@/utils/deletedResourceRegistry';
import { isNotFoundError } from '@/utils/isNotFoundError';
import { shouldRetryQuery } from '@/utils/queryRetry';

export function createAudiobookDetailQueryOptions(
   audiobookId: string,
   enabled: boolean
) {
   return {
      queryKey: queryKeys.audiobooks.detail(audiobookId),
      queryFn: async () => {
         if (isResourceDeleted('audiobooks', audiobookId)) {
            throw new ApiError(404, 'Audiobook not found');
         }

         try {
            return await getAudiobookById(audiobookId);
         } catch (error) {
            if (isNotFoundError(error)) {
               markResourceDeleted('audiobooks', audiobookId);
            }
            throw error;
         }
      },
      enabled:
         enabled &&
         !!audiobookId &&
         !isResourceDeleted('audiobooks', audiobookId),
      retry: shouldRetryQuery,
      meta: { silent404: true },
   };
}
