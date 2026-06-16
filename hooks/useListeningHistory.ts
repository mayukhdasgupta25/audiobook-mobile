import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getListeningHistoryByProfileId } from '@/services/listeningHistory';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthQueryEnabled } from '@/hooks/useAuthQueryEnabled';
import { RootState } from '@/store';

export function useListeningHistory() {
   const userProfileId = useSelector((state: RootState) => state.auth.userProfile?.id);
   const authEnabled = useAuthQueryEnabled();

   return useQuery({
      queryKey: queryKeys.playback.listeningHistory(userProfileId ?? ''),
      queryFn: () => getListeningHistoryByProfileId(userProfileId!),
      enabled: authEnabled && Boolean(userProfileId),
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
   });
}
