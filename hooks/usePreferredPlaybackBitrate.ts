/**
 * Resolves preferred HLS playback bitrate (kbps) from the user's subscription tier.
 */

import { useMemo } from 'react';
import { getPreferredBitrateKbpsForTier } from '@/utils/audioQualityDisplay';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserSubscription } from '@/hooks/useUserSubscription';

export function usePreferredPlaybackBitrate(): number {
   const { activeSubscription } = useUserSubscription();
   const { plans } = useSubscriptionPlans();

   return useMemo(() => {
      const tier = resolveMembershipTier(activeSubscription?.plan, plans);
      return getPreferredBitrateKbpsForTier(tier);
   }, [activeSubscription?.plan, plans]);
}
