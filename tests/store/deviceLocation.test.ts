import {
   clearDeviceLocationCache,
   getCachedDeviceLocation,
   isLocationCacheFresh,
   useDeviceLocationStore,
} from '@/store/deviceLocation';
import type { DeviceLocationReading } from '@/store/deviceLocation';

const sampleLocation: DeviceLocationReading = {
   latitude: 40.7128,
   longitude: -74.006,
   accuracy: 10,
   altitude: null,
   timestamp: '2026-01-01T00:00:00.000Z',
};

describe('deviceLocation store', () => {
   beforeEach(() => {
      clearDeviceLocationCache();
   });

   it('isLocationCacheFresh returns false when cache is empty', () => {
      expect(isLocationCacheFresh()).toBe(false);
   });

   it('isLocationCacheFresh returns true shortly after setLocation', () => {
      useDeviceLocationStore.getState().setLocation(sampleLocation);
      expect(isLocationCacheFresh(60_000)).toBe(true);
      expect(getCachedDeviceLocation()).toEqual(sampleLocation);
   });

   it('isLocationCacheFresh returns false when cache exceeded max age', () => {
      useDeviceLocationStore.setState({
         location: sampleLocation,
         fetchedAt: Date.now() - 10 * 60 * 1000,
         isFetching: false,
      });
      expect(isLocationCacheFresh(5 * 60 * 1000)).toBe(false);
   });

   it('clearDeviceLocationCache resets state', () => {
      useDeviceLocationStore.getState().setLocation(sampleLocation);
      clearDeviceLocationCache();
      expect(getCachedDeviceLocation()).toBeNull();
      expect(isLocationCacheFresh()).toBe(false);
   });
});
