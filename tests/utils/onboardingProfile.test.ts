import {
   isOnboardingProfileIncomplete,
   parseIsNewUserFlag,
} from '@/utils/onboardingProfile';
import type { UserProfile } from '@/services/user';

const completeProfile: UserProfile = {
   id: '1',
   userId: 'u1',
   username: 'user',
   email: 'user@example.com',
   firstName: 'Jane',
   lastName: 'Doe',
   address: '123 Main St',
   contact: '+919876543210',
   avatar: null,
   age: 25,
   gender: 'MALE',
   location: 'Mumbai, India',
   preferences: {
      theme: 'dark',
      autoPlay: false,
      language: 'en',
      playbackSpeed: 1,
      favoriteGenreIds: ['g1'],
      languages: ['hi', 'en'],
   },
   createdAt: '',
   updatedAt: '',
};

describe('onboardingProfile utils', () => {
   it('parseIsNewUserFlag accepts common API shapes', () => {
      expect(parseIsNewUserFlag({ isNewUser: true })).toBe(true);
      expect(parseIsNewUserFlag({ is_new_user: 'true' })).toBe(true);
      expect(parseIsNewUserFlag({ newUser: 1 })).toBe(true);
      expect(parseIsNewUserFlag({ isNewUser: false })).toBe(false);
   });

   it('isOnboardingProfileIncomplete is true when wizard fields are missing', () => {
      expect(isOnboardingProfileIncomplete(null)).toBe(true);
      expect(
         isOnboardingProfileIncomplete({
            ...completeProfile,
            age: null,
         })
      ).toBe(true);
      expect(
         isOnboardingProfileIncomplete({
            ...completeProfile,
            gender: null,
         })
      ).toBe(true);
      expect(
         isOnboardingProfileIncomplete({
            ...completeProfile,
            preferences: { ...completeProfile.preferences, favoriteGenreIds: [] },
         })
      ).toBe(true);
      expect(
         isOnboardingProfileIncomplete({
            ...completeProfile,
            preferences: { ...completeProfile.preferences, languages: [] },
         })
      ).toBe(true);
      expect(isOnboardingProfileIncomplete(completeProfile)).toBe(false);
   });
});
