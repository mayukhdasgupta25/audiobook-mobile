import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getUserAudiobooksByProfileId } from '@/services/userAudiobooks';
import { getFavorites } from '@/services/favorites';
import { ApiError } from '@/services/api';
import { formatProfileListeningHours } from '@/utils/listeningDuration';
import { useAuthQueryEnabled } from '@/hooks/useAuthQueryEnabled';
import { RootState } from '@/store';

export interface ProfileStatsValues {
   titlesListened: string;
   hoursListened: string;
   favorites: string;
   downloads: string;
}

const DOWNLOADS_PLACEHOLDER = '0';

function formatCount(count: number): string {
   return String(Math.max(0, count));
}

export function useProfileStats() {
   const userProfileId = useSelector((state: RootState) => state.auth.userProfile?.id);
   const authEnabled = useAuthQueryEnabled();

   const userAudiobooksQuery = useQuery({
      queryKey: ['user-audiobooks', userProfileId],
      queryFn: () => getUserAudiobooksByProfileId(userProfileId!),
      enabled: authEnabled && Boolean(userProfileId),
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });

   const favoritesQuery = useQuery({
      queryKey: ['favorites', 'profile-stats'],
      queryFn: () => getFavorites(),
      enabled: authEnabled,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 60 * 1000,
   });

   const stats: ProfileStatsValues = useMemo(() => {
      const isLoading =
         userAudiobooksQuery.isLoading || favoritesQuery.isLoading;

      if (isLoading) {
         return {
            titlesListened: '—',
            hoursListened: '—',
            favorites: '—',
            downloads: DOWNLOADS_PLACEHOLDER,
         };
      }

      const userAudiobooks = userAudiobooksQuery.data ?? [];

      return {
         titlesListened: formatCount(userAudiobooks.length),
         hoursListened: formatProfileListeningHours(userAudiobooks),
         favorites: formatCount(favoritesQuery.data?.length ?? 0),
         downloads: DOWNLOADS_PLACEHOLDER,
      };
   }, [
      userAudiobooksQuery.isLoading,
      userAudiobooksQuery.data,
      favoritesQuery.isLoading,
      favoritesQuery.data,
   ]);

   return {
      stats,
      isLoading: userAudiobooksQuery.isLoading || favoritesQuery.isLoading,
      isError: userAudiobooksQuery.isError || favoritesQuery.isError,
   };
}
