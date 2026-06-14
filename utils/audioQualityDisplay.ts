import type { MembershipTier } from '@/utils/membershipDisplay';
import { resolveMembershipTier } from '@/utils/membershipDisplay';
import type { SubscriptionPlan } from '@/services/subscriptions';

export interface AudioQualityDisplay {
   kbpsLabel: string;
   plainEnglishLabel: string;
}

/** Playback bitrates in kbps, keyed by membership tier. */
export const TIER_BITRATE_KBPS: Record<MembershipTier, number> = {
   none: 64,
   base: 64,
   standard: 128,
   premium: 256,
};

/** Descending fallback chain for HLS variant selection. */
export const PLAYBACK_BITRATE_FALLBACK_CHAIN = [256, 128, 64] as const;

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

export function getPreferredBitrateKbpsForTier(tier: MembershipTier): number {
   return TIER_BITRATE_KBPS[tier];
}

export function getNextLowerBitrateKbps(currentKbps: number): number | null {
   const currentIndex = PLAYBACK_BITRATE_FALLBACK_CHAIN.indexOf(
      currentKbps as (typeof PLAYBACK_BITRATE_FALLBACK_CHAIN)[number]
   );
   if (currentIndex === -1) {
      for (const bitrate of PLAYBACK_BITRATE_FALLBACK_CHAIN) {
         if (bitrate < currentKbps) {
            return bitrate;
         }
      }
      return null;
   }
   const nextIndex = currentIndex + 1;
   return nextIndex < PLAYBACK_BITRATE_FALLBACK_CHAIN.length
      ? PLAYBACK_BITRATE_FALLBACK_CHAIN[nextIndex]
      : null;
}

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
