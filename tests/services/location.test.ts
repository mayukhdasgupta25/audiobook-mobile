import {
   clearDeviceLocationCache,
   fetchDeviceLocationInMemory,
   syncUserLocationToProfile,
} from '@/services/location';
import { useDeviceLocationStore } from '@/store/deviceLocation';
import { updateUserProfile } from '@/services/user';

jest.mock('expo-location', () => ({
   PermissionStatus: { GRANTED: 'granted' },
   Accuracy: { Balanced: 3 },
   requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
   hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
   getCurrentPositionAsync: jest.fn().mockResolvedValue({
      coords: {
         latitude: 51.5074,
         longitude: -0.1278,
         accuracy: 12,
         altitude: null,
      },
      timestamp: 1_700_000_000_000,
   }),
}));

jest.mock('@/services/user', () => ({
   updateUserProfile: jest.fn().mockResolvedValue({ success: true }),
}));

const mockedUpdateUserProfile = updateUserProfile as jest.MockedFunction<
   typeof updateUserProfile
>;

describe('location service', () => {
   beforeEach(() => {
      jest.clearAllMocks();
      clearDeviceLocationCache();
   });

   it('fetchDeviceLocationInMemory stores coordinates in the device location store', async () => {
      const location = await fetchDeviceLocationInMemory();

      expect(location).toMatchObject({
         latitude: 51.5074,
         longitude: -0.1278,
      });
      expect(useDeviceLocationStore.getState().location).toEqual(location);
   });

   it('syncUserLocationToProfile uses fresh cache without calling GPS again', async () => {
      useDeviceLocationStore.setState({
         location: {
            latitude: 48.8566,
            longitude: 2.3522,
            accuracy: 5,
            altitude: null,
            timestamp: '2026-01-01T12:00:00.000Z',
         },
         fetchedAt: Date.now(),
         isFetching: false,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Location = require('expo-location');

      await syncUserLocationToProfile();

      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
      expect(mockedUpdateUserProfile).toHaveBeenCalledWith({
         location: expect.objectContaining({
            latitude: 48.8566,
            longitude: 2.3522,
         }),
      });
   });

   it('syncUserLocationToProfile fetches GPS when cache is stale', async () => {
      useDeviceLocationStore.setState({
         location: {
            latitude: 1,
            longitude: 2,
            accuracy: null,
            altitude: null,
            timestamp: '2020-01-01T00:00:00.000Z',
         },
         fetchedAt: Date.now() - 10 * 60 * 1000,
         isFetching: false,
      });

      await syncUserLocationToProfile();

      expect(mockedUpdateUserProfile).toHaveBeenCalledWith({
         location: expect.objectContaining({
            latitude: 51.5074,
            longitude: -0.1278,
         }),
      });
   });
});
