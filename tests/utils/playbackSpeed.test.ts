import {
   getNextPlaybackSpeed,
   getPreviousPlaybackSpeed,
   isPlaybackSpeed,
} from '@/utils/playbackSpeed';

describe('playbackSpeed utils', () => {
   it('getNextPlaybackSpeed wraps from 1.75 to 0.5', () => {
      expect(getNextPlaybackSpeed(1.75)).toBe(0.5);
   });

   it('getPreviousPlaybackSpeed wraps from 0.5 to 1.75', () => {
      expect(getPreviousPlaybackSpeed(0.5)).toBe(1.75);
   });

   it('steps through adjacent speeds', () => {
      expect(getNextPlaybackSpeed(1)).toBe(1.25);
      expect(getPreviousPlaybackSpeed(1)).toBe(0.75);
   });

   it('isPlaybackSpeed validates known values', () => {
      expect(isPlaybackSpeed(1.25)).toBe(true);
      expect(isPlaybackSpeed(2)).toBe(false);
   });
});
