import {
   fetchMergedUserProfile,
   getAppUserProfile,
   mergeUserProfiles,
   updateAppUserProfile,
} from '@/services/user';
import { getAuthUserProfile } from '@/services/authProfile';
import { get, put } from '@/services/api';

jest.mock('@/services/authProfile', () => ({
   getAuthUserProfile: jest.fn(),
}));

jest.mock('@/services/api', () => ({
   get: jest.fn(),
   put: jest.fn(),
   API_V1_PATH: '/api/v1',
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
const mockedGetAuthUserProfile = getAuthUserProfile as jest.MockedFunction<
   typeof getAuthUserProfile
>;

const authProfile = {
   id: 'auth-u1',
   email: 'user@example.com',
   role: 'LISTENER',
   emailVerified: true,
   firstName: 'Jane',
   lastName: 'Doe',
   address: '123 Main St',
   contact: '+919876543210',
   gender: 'FEMALE',
   location: 'Mumbai, India',
   age: 28,
   createdAt: '2026-01-01T00:00:00.000Z',
   updatedAt: '2026-01-01T00:00:00.000Z',
};

const appProfile = {
   id: 'profile-1',
   userId: 'auth-u1',
   username: 'janedoe',
   avatar: '/uploads/avatar.jpg',
   preferences: {
      theme: 'dark' as const,
      autoPlay: false,
      language: 'en',
      playbackSpeed: 1,
      favoriteGenreIds: ['g1'],
      languages: ['hi', 'en'],
   },
   createdAt: '2026-01-01T00:00:00.000Z',
   updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('user profile service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('mergeUserProfiles combines auth and app fields', () => {
      const merged = mergeUserProfiles(authProfile, appProfile);

      expect(merged).toEqual({
         id: 'profile-1',
         userId: 'auth-u1',
         username: 'janedoe',
         avatar: '/uploads/avatar.jpg',
         preferences: appProfile.preferences,
         createdAt: appProfile.createdAt,
         updatedAt: appProfile.updatedAt,
         email: 'user@example.com',
         firstName: 'Jane',
         lastName: 'Doe',
         address: '123 Main St',
         contact: '+919876543210',
         gender: 'FEMALE',
         location: 'Mumbai, India',
         age: 28,
      });
   });

   it('getAppUserProfile calls GET /api/v1/user/profile on main API', async () => {
      mockedGet.mockResolvedValue({
         data: {
            success: true,
            data: appProfile,
            message: 'ok',
            statusCode: 200,
            timestamp: '',
            path: '/api/v1/user/profile',
         },
         status: 200,
         statusText: 'OK',
      });

      const result = await getAppUserProfile();

      expect(mockedGet).toHaveBeenCalledWith('/api/v1/user/profile', true);
      expect(result.data).toEqual(appProfile);
   });

   it('updateAppUserProfile sends only app profile fields', async () => {
      mockedPut.mockResolvedValue({
         data: {
            success: true,
            data: appProfile,
            message: 'ok',
            statusCode: 200,
            timestamp: '',
            path: '/api/v1/user/profile',
         },
         status: 200,
         statusText: 'OK',
      });

      await updateAppUserProfile({
         preferences: {
            favoriteGenreIds: ['g1'],
            languages: ['hi'],
         },
      });

      expect(mockedPut).toHaveBeenCalledWith(
         '/api/v1/user/profile',
         {
            preferences: {
               favoriteGenreIds: ['g1'],
               languages: ['hi'],
            },
         },
         true
      );
   });

   it('fetchMergedUserProfile fetches auth and app profiles in parallel', async () => {
      mockedGetAuthUserProfile.mockResolvedValue({ user: authProfile });
      mockedGet.mockResolvedValue({
         data: {
            success: true,
            data: appProfile,
            message: 'ok',
            statusCode: 200,
            timestamp: '',
            path: '/api/v1/user/profile',
         },
         status: 200,
         statusText: 'OK',
      });

      const merged = await fetchMergedUserProfile();

      expect(mockedGetAuthUserProfile).toHaveBeenCalled();
      expect(mockedGet).toHaveBeenCalledWith('/api/v1/user/profile', true);
      expect(merged.email).toBe('user@example.com');
      expect(merged.username).toBe('janedoe');
      expect(merged.age).toBe(28);
   });
});
