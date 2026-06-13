import type { MembershipTier } from '@/utils/membershipDisplay';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import type { SubscriptionPlan } from '@/services/subscriptions';

export interface AudioQualityDisplay {
   kbpsLabel: string;
   plainEnglishLabel: string;
}

const TIER_QUALITY: Record<Exclude<MembershipTier, 'none'>, AudioQualityDisplay> = {
   base: {
      kbpsLabel: '64 kbps',
      plainEnglishLabel: 'Standard quality — clear audio for everyday listening',
   },
   standard: {
      kbpsLabel: '128 kbps',
      plainEnglishLabel: 'High quality — richer detail and clarity',
   },
   premium: {
      kbpsLabel: '256 kbps',
      plainEnglishLabel: 'Premium quality — our best listening experience',
   },
};

export function getAudioQualityForTier(tier: MembershipTier): AudioQualityDisplay | null {
   if (tier === 'none') {
      return null;
   }
   return TIER_QUALITY[tier];
}

export function getPlanAudioQualityDisplay(
   plan: SubscriptionPlan,
   allPlans?: SubscriptionPlan[]
): AudioQualityDisplay {
   const tier = resolveMembershipTier(plan, allPlans);
   return getAudioQualityForTier(tier) ?? TIER_QUALITY.base;
}
