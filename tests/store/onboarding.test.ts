import { formatGenderForApi } from '@/store/onboarding';

describe('formatGenderForApi', () => {
   it('returns uppercase gender values for the profile API', () => {
      expect(formatGenderForApi('male')).toBe('MALE');
      expect(formatGenderForApi('female')).toBe('FEMALE');
      expect(formatGenderForApi('non_binary')).toBe('NON_BINARY');
      expect(formatGenderForApi('prefer_not_to_say')).toBe('PREFER_NOT_TO_SAY');
   });
});
