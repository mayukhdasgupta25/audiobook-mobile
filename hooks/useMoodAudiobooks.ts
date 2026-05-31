import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getAudiobooksByMood } from '@/services/audiobooks';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

export function useMoodAudiobooks(moodId: string, page = 1) {
   const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);

   return useQuery({
      queryKey: ['audiobooks', 'mood', moodId, page],
      queryFn: () => getAudiobooksByMood(moodId, page),
      enabled: isInitialized && moodId.length > 0,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });
}
