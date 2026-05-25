/**
 * TanStack Query mutation for creating or changing a subscription
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
   createSubscription,
   changeSubscriptionPlan,
   UserSubscription,
} from '@/services/subscriptions';

export interface SubscribeToPlanInput {
   planId: string;
   activeSubscription: UserSubscription | null;
}

/**
 * Subscribe (create) or change plan (upgrade/downgrade) for the current user
 */
export function useSubscriptionMutation() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ planId, activeSubscription }: SubscribeToPlanInput) => {
         if (activeSubscription) {
            return changeSubscriptionPlan(activeSubscription.id, { planId });
         }
         return createSubscription({ planId });
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] });
         queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      },
   });
}
