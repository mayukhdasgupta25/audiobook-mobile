import {
   requestDeviceRemovalOtp,
   resendDeviceRemovalOtp,
   confirmDeviceRemoval,
} from '@/services/devices';
import { post, del } from '@/services/api';

jest.mock('@/services/api', () => ({
   post: jest.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' }),
   del: jest.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' }),
   get: jest.fn(),
}));

const mockedPost = post as jest.MockedFunction<typeof post>;
const mockedDel = del as jest.MockedFunction<typeof del>;

describe('devices service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('requestDeviceRemovalOtp posts email and device record id as deviceId to auth API', async () => {
      await requestDeviceRemovalOtp({
         email: 'user@example.com',
         deviceId: '20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
      });

      expect(mockedPost).toHaveBeenCalledWith(
         '/auth/devices/request-removal-otp',
         {
            email: 'user@example.com',
            deviceId: '20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
         },
         false,
         true
      );
   });

   it('resendDeviceRemovalOtp posts to resend endpoint with same body', async () => {
      await resendDeviceRemovalOtp({
         email: 'user@example.com',
         deviceId: '20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
      });

      expect(mockedPost).toHaveBeenCalledWith(
         '/auth/devices/resend-removal-otp',
         {
            email: 'user@example.com',
            deviceId: '20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
         },
         false,
         true
      );
   });

   it('confirmDeviceRemoval deletes by record id with email and otp body', async () => {
      await confirmDeviceRemoval({
         recordId: '20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
         email: 'user@example.com',
         otp: '123456',
      });

      expect(mockedDel).toHaveBeenCalledWith(
         '/auth/devices/20d2fc3b-15d8-4342-8c8d-d530d48d0b2f',
         false,
         true,
         false,
         { email: 'user@example.com', otp: '123456' }
      );
   });
});
