import {
   resolveMembershipTier,
   getMembershipLabel,
   getMembershipCrownColor,
   hasPaidMembership,
   MEMBERSHIP_CROWN_COLORS,
} from '@/utils/membershipDisplay';
import type { SubscriptionPlan } from '@/services/subscriptions';

function makePlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
   return {
      id: 'plan-1',
      name: 'Premium',
      description: '',
      price: 9.99,
      currency: 'USD',
      tierLevel: 3,
      billingInterval: 'monthly',
      trialDays: 0,
      features: {
         maxDevices: 3,
         audioQuality: 'best',
         audiobookCatalog: 'all',
         deviceChangesPerMonth: 2,
      },
      featureDescriptions: [],
      isActive: true,
      createdAt: '',
      updatedAt: '',
      ...overrides,
   };
}

describe('membershipDisplay utils', () => {
   it('returns none when plan is missing', () => {
      expect(resolveMembershipTier(null)).toBe('none');
      expect(resolveMembershipTier(undefined)).toBe('none');
   });

   it('resolves tier from plan name', () => {
      expect(resolveMembershipTier(makePlan({ name: 'Premium Plan', tierLevel: 99 }))).toBe(
         'premium'
      );
      expect(resolveMembershipTier(makePlan({ name: 'Standard', tierLevel: 1 }))).toBe('standard');
      expect(resolveMembershipTier(makePlan({ name: 'Base Tier', tierLevel: 99 }))).toBe('base');
   });

   it('falls back to tierLevel against catalog when name is unknown', () => {
      const catalog = [
         makePlan({ id: '1', name: 'Starter', tierLevel: 1 }),
         makePlan({ id: '2', name: 'Plus', tierLevel: 2 }),
         makePlan({ id: '3', name: 'Max', tierLevel: 3 }),
      ];

      expect(resolveMembershipTier(makePlan({ name: 'Starter', tierLevel: 1 }), catalog)).toBe(
         'base'
      );
      expect(resolveMembershipTier(makePlan({ name: 'Plus', tierLevel: 2 }), catalog)).toBe(
         'standard'
      );
      expect(resolveMembershipTier(makePlan({ name: 'Max', tierLevel: 3 }), catalog)).toBe(
         'premium'
      );
   });

   it('returns membership labels', () => {
      expect(getMembershipLabel('none')).toBe('No active membership');
      expect(getMembershipLabel('premium', 'Premium')).toBe('Premium Member');
      expect(getMembershipLabel('base')).toBe('Base Member');
   });

   it('returns crown colors for paid tiers only', () => {
      expect(getMembershipCrownColor('premium')).toBe(MEMBERSHIP_CROWN_COLORS.premium);
      expect(getMembershipCrownColor('standard')).toBe(MEMBERSHIP_CROWN_COLORS.standard);
      expect(getMembershipCrownColor('base')).toBe(MEMBERSHIP_CROWN_COLORS.base);
      expect(getMembershipCrownColor('none')).toBeUndefined();
   });

   it('detects paid membership', () => {
      expect(hasPaidMembership('none')).toBe(false);
      expect(hasPaidMembership('premium')).toBe(true);
   });
});
