import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getMoods } from '@/services/moods';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

export function useMoods() {
   const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);

   return useQuery({
      queryKey: ['moods'],
      queryFn: () => getMoods(),
      enabled: isInitialized,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 10 * 60 * 1000,
   });
}
