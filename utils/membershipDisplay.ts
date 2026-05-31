import type { SubscriptionPlan } from '@/services/subscriptions';

export type MembershipTier = 'none' | 'base' | 'standard' | 'premium';

export const MEMBERSHIP_CROWN_COLORS = {
   premium: '#D4A017',
   standard: '#A8A8A8',
   base: '#CD7F32',
} as const;

const TIER_NAME_PATTERNS: { tier: Exclude<MembershipTier, 'none'>; pattern: RegExp }[] = [
   { tier: 'premium', pattern: /premium/i },
   { tier: 'standard', pattern: /standard/i },
   { tier: 'base', pattern: /base/i },
];

/**
 * Resolve membership tier from plan name, with optional tierLevel fallback
 * against the sorted catalog of active plans.
 */
export function resolveMembershipTier(
   plan: SubscriptionPlan | null | undefined,
   allPlans?: SubscriptionPlan[]
): MembershipTier {
   if (!plan) {
      return 'none';
   }

   const normalizedName = plan.name.trim().toLowerCase();
   for (const { tier, pattern } of TIER_NAME_PATTERNS) {
      if (pattern.test(normalizedName)) {
         return tier;
      }
   }

   const activePlans = (allPlans ?? [])
      .filter((entry) => entry.isActive)
      .sort((a, b) => a.tierLevel - b.tierLevel);

   if (activePlans.length === 0) {
      return 'none';
   }

   const sortedLevels = [...new Set(activePlans.map((entry) => entry.tierLevel))].sort(
      (a, b) => a - b
   );
   const tierIndex = sortedLevels.indexOf(plan.tierLevel);

   if (tierIndex === -1) {
      return 'none';
   }

   if (sortedLevels.length === 1) {
      return 'base';
   }

   if (sortedLevels.length === 2) {
      return tierIndex === sortedLevels.length - 1 ? 'premium' : 'base';
   }

   if (tierIndex === 0) {
      return 'base';
   }
   if (tierIndex === sortedLevels.length - 1) {
      return 'premium';
   }
   return 'standard';
}

export function getMembershipLabel(tier: MembershipTier, planName?: string): string {
   if (tier === 'none') {
      return 'No active membership';
   }

   if (planName?.trim()) {
      return `${planName.trim()} Member`;
   }

   const fallbackLabels: Record<Exclude<MembershipTier, 'none'>, string> = {
      base: 'Base Member',
      standard: 'Standard Member',
      premium: 'Premium Member',
   };

   return fallbackLabels[tier];
}

export function getMembershipCrownColor(tier: MembershipTier): string | undefined {
   if (tier === 'none') {
      return undefined;
   }
   return MEMBERSHIP_CROWN_COLORS[tier];
}

export function hasPaidMembership(tier: MembershipTier): boolean {
   return tier !== 'none';
}
