/**
 * TanStack Query hook for fetching user subscriptions
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
   getUserSubscriptions,
   getActiveSubscription,
} from '@/services/subscriptions';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch the current user's subscriptions by profile ID
 */
export function useUserSubscription(userProfileId: string) {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   const query = useQuery({
      queryKey: ['subscriptions', 'user', userProfileId],
      queryFn: () => getUserSubscriptions(userProfileId),
      enabled: !!userProfileId && isAuthenticated && isInitialized,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });

   const activeSubscription = useMemo(
      () => getActiveSubscription(query.data?.data ?? []),
      [query.data?.data]
   );

   return {
      ...query,
      activeSubscription,
   };
}
