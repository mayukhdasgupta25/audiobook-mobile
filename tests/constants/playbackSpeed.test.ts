import {
   PLAYBACK_SPEED_OPTIONS,
   formatPlaybackSpeedLabel,
} from '@/constants/playbackSpeed';

describe('playbackSpeed constants', () => {
   it('exposes the five supported speed options', () => {
      expect(PLAYBACK_SPEED_OPTIONS).toEqual([0.5, 0.75, 1, 1.25, 1.75]);
   });

   it('formatPlaybackSpeedLabel uses 1x for normal speed', () => {
      expect(formatPlaybackSpeedLabel(1)).toBe('1x');
   });

   it('formatPlaybackSpeedLabel formats fractional speeds', () => {
      expect(formatPlaybackSpeedLabel(1.25)).toBe('1.25x');
      expect(formatPlaybackSpeedLabel(0.5)).toBe('0.5x');
   });
});
