import { resendRegistrationOTP } from '@/services/auth';
import { post } from '@/services/api';

jest.mock('@react-native-google-signin/google-signin', () => ({
   GoogleSignin: {
      configure: jest.fn(),
      signOut: jest.fn(() => Promise.resolve()),
      revokeAccess: jest.fn(() => Promise.resolve()),
   },
}));

jest.mock('@/services/api', () => ({
   post: jest.fn(),
   ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
         super(message);
         this.status = status;
      }
   },
}));

const mockedPost = post as jest.MockedFunction<typeof post>;

describe('resendRegistrationOTP', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('sends email and REGISTRATION purpose to resend-otp endpoint', async () => {
      mockedPost.mockResolvedValue({
         data: { message: 'OTP resent successfully' },
         status: 200,
         statusText: 'OK',
      });

      const result = await resendRegistrationOTP({ email: 'user@example.com' });

      expect(mockedPost).toHaveBeenCalledWith(
         '/auth/resend-otp',
         { email: 'user@example.com', purpose: 'REGISTRATION' },
         false,
         true
      );
      expect(result).toEqual({ message: 'OTP resent successfully' });
   });
});
