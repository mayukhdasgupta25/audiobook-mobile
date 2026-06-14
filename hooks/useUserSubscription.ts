/**
 * TanStack Query hook for fetching the current user's subscription
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getMySubscription } from '@/services/subscriptions';
import { ApiError } from '@/services/api';
import { queryKeys } from '@/constants/queryKeys';
import { RootState } from '@/store';

/**
 * Hook to fetch the current user's active subscription
 */
export function useUserSubscription() {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   const query = useQuery({
      queryKey: queryKeys.subscriptions.me(),
      queryFn: () => getMySubscription(),
      enabled: isAuthenticated && isInitialized,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
   });

   const activeSubscription = useMemo(
      () => query.data?.subscription ?? null,
      [query.data?.subscription]
   );

   return {
      ...query,
      activeSubscription,
   };
}
