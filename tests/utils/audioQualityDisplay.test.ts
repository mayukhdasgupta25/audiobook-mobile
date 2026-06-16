import {
   getAudioQualityForTier,
   getNextLowerBitrateKbps,
   getPlanAudioQualityDisplay,
   getPreferredBitrateKbpsForTier,
} from '@/utils/audioQualityDisplay';
import type { SubscriptionPlan } from '@/services/subscriptions';

function makePlan(name: string, tierLevel: number): SubscriptionPlan {
   return {
      id: `plan-${tierLevel}`,
      name,
      description: '',
      price: 0,
      currency: 'INR',
      tierLevel,
      billingInterval: 'monthly',
      trialDays: 0,
      features: {
         maxDevices: 1,
         audioQuality: 'base',
         audiobookCatalog: 'selected',
         deviceChangesPerMonth: 1,
      },
      featureDescriptions: [],
      isActive: true,
      createdAt: '',
      updatedAt: '',
   };
}

describe('audioQualityDisplay', () => {
   it('maps membership tiers to preferred playback bitrates', () => {
      expect(getPreferredBitrateKbpsForTier('none')).toBe(64);
      expect(getPreferredBitrateKbpsForTier('base')).toBe(64);
      expect(getPreferredBitrateKbpsForTier('standard')).toBe(128);
      expect(getPreferredBitrateKbpsForTier('premium')).toBe(256);
   });

   it('steps down through the playback fallback chain', () => {
      expect(getNextLowerBitrateKbps(256)).toBe(128);
      expect(getNextLowerBitrateKbps(128)).toBe(64);
      expect(getNextLowerBitrateKbps(64)).toBeNull();
   });

   it('maps tiers to kbps labels', () => {
      expect(getAudioQualityForTier('base')?.kbpsLabel).toBe('64 kbps');
      expect(getAudioQualityForTier('standard')?.kbpsLabel).toBe('128 kbps');
      expect(getAudioQualityForTier('premium')?.kbpsLabel).toBe('256 kbps');
   });

   it('uses plain English labels without kbps for comparison', () => {
      const display = getAudioQualityForTier('standard');
      expect(display?.plainEnglishLabel).toContain('High quality');
      expect(display?.plainEnglishLabel).not.toContain('kbps');
   });

   it('resolves plan tier from plan name', () => {
      const plans = [
         makePlan('Base', 1),
         makePlan('Standard', 2),
         makePlan('Premium', 3),
      ];
      expect(getPlanAudioQualityDisplay(makePlan('Premium', 3), plans).kbpsLabel).toBe(
         '256 kbps'
      );
   });
});
