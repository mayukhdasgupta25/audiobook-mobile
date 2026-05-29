import {
   getAuthApiErrorMessage,
   isDeviceLimitExceededError,
} from '@/utils/authApiErrors';

describe('getAuthApiErrorMessage', () => {
   it('returns the error field from auth API payloads', () => {
      expect(
         getAuthApiErrorMessage({
            error: 'Device limit reached for your subscription plan',
            code: 'DEVICE_LIMIT_EXCEEDED',
         })
      ).toBe('Device limit reached for your subscription plan');
   });

   it('falls back to message when error is absent', () => {
      expect(getAuthApiErrorMessage({ message: 'Invalid credentials' })).toBe(
         'Invalid credentials'
      );
   });

   it('returns null for empty or invalid payloads', () => {
      expect(getAuthApiErrorMessage(null)).toBeNull();
      expect(getAuthApiErrorMessage({})).toBeNull();
      expect(getAuthApiErrorMessage({ error: '   ' })).toBeNull();
   });
});

describe('isDeviceLimitExceededError', () => {
   it('detects DEVICE_LIMIT_EXCEEDED code', () => {
      expect(
         isDeviceLimitExceededError({
            error: 'Device limit reached for your subscription plan',
            code: 'DEVICE_LIMIT_EXCEEDED',
         })
      ).toBe(true);
   });

   it('returns false for other errors', () => {
      expect(isDeviceLimitExceededError({ code: 'OTHER' })).toBe(false);
      expect(isDeviceLimitExceededError(null)).toBe(false);
   });
});
