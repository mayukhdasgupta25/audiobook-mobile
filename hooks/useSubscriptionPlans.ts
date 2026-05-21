/**
 * TanStack Query hook for fetching subscription plans catalog
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getSubscriptionPlans } from '@/services/subscriptions';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';

/**
 * Hook to fetch all available subscription plans
 */
export function useSubscriptionPlans() {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   const query = useQuery({
      queryKey: ['subscription-plans'],
      queryFn: () => getSubscriptionPlans(),
      enabled: isAuthenticated && isInitialized,
      retry: (failureCount, error) => {
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
   });

   const plans = useMemo(() => {
      const activePlans = (query.data?.data ?? []).filter((plan) => plan.isActive);
      return [...activePlans].sort((a, b) => a.tierLevel - b.tierLevel);
   }, [query.data?.data]);

   return {
      ...query,
      plans,
   };
}
