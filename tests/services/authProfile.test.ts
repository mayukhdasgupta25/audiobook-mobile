import {
   getAuthUserProfile,
   updateAuthUserProfile,
} from '@/services/authProfile';
import { get, put } from '@/services/api';

jest.mock('@/services/api', () => ({
   get: jest.fn(),
   put: jest.fn(),
   ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
         super(message);
         this.status = status;
      }
   },
}));

const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedPut = put as jest.MockedFunction<typeof put>;

describe('authProfile service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('getAuthUserProfile calls GET /auth/user/profile on auth API', async () => {
      const user = {
         id: 'u1',
         email: 'user@example.com',
         role: 'LISTENER',
         emailVerified: true,
         firstName: 'Jane',
         age: 30,
         gender: 'FEMALE',
         createdAt: '2026-01-01T00:00:00.000Z',
         updatedAt: '2026-01-01T00:00:00.000Z',
      };

      mockedGet.mockResolvedValue({
         data: { user },
         status: 200,
         statusText: 'OK',
      });

      const result = await getAuthUserProfile();

      expect(mockedGet).toHaveBeenCalledWith('/auth/user/profile', true, true);
      expect(result.user).toEqual(user);
   });

   it('updateAuthUserProfile sends age and gender to PUT /auth/user/profile', async () => {
      const user = {
         id: 'u1',
         email: 'user@example.com',
         role: 'LISTENER',
         emailVerified: true,
         age: 25,
         gender: 'MALE',
         createdAt: '2026-01-01T00:00:00.000Z',
         updatedAt: '2026-01-02T00:00:00.000Z',
      };

      mockedPut.mockResolvedValue({
         data: { message: 'Profile updated successfully', user },
         status: 200,
         statusText: 'OK',
      });

      const result = await updateAuthUserProfile({
         age: 25,
         gender: 'MALE',
      });

      expect(mockedPut).toHaveBeenCalledWith(
         '/auth/user/profile',
         { age: 25, gender: 'MALE' },
         true,
         true
      );
      expect(result.user).toEqual(user);
   });

   it('updateAuthUserProfile sends location coordinates', async () => {
      mockedPut.mockResolvedValue({
         data: {
            message: 'Profile updated successfully',
            user: {
               id: 'u1',
               email: 'user@example.com',
               role: 'LISTENER',
               emailVerified: true,
               location: 'London, UK',
               createdAt: '2026-01-01T00:00:00.000Z',
               updatedAt: '2026-01-02T00:00:00.000Z',
            },
         },
         status: 200,
         statusText: 'OK',
      });

      await updateAuthUserProfile({
         location: { latitude: '51.5074', longitude: '-0.1278' },
      });

      expect(mockedPut).toHaveBeenCalledWith(
         '/auth/user/profile',
         { location: { latitude: '51.5074', longitude: '-0.1278' } },
         true,
         true
      );
   });
});
