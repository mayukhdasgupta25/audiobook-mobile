import { ApiError } from '@/services/api';
import {
   DEFAULT_API_ERROR_MESSAGE,
   getApiErrorMessage,
} from '@/utils/getApiErrorMessage';
import { TOAST_DURATION_MS } from '@/utils/toast';

describe('getApiErrorMessage', () => {
   it('returns message from ApiError data', () => {
      const error = new ApiError(400, 'Bad Request', { message: 'Invalid input' });
      expect(getApiErrorMessage(error)).toBe('Invalid input');
   });

   it('returns Error message for generic errors', () => {
      expect(getApiErrorMessage(new Error('Network failed'))).toBe('Network failed');
   });

   it('returns fallback for unknown errors', () => {
      expect(getApiErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
   });

   it('uses default fallback when none provided', () => {
      expect(getApiErrorMessage(undefined)).toBe(DEFAULT_API_ERROR_MESSAGE);
   });
});

describe('toast constants', () => {
   it('uses 3 second duration', () => {
      expect(TOAST_DURATION_MS).toBe(3000);
   });
});
