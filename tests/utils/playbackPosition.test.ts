import {
   clampPlaybackSeekSeconds,
   clampScrubProgress,
   clampSyncPlaybackPosition,
   getMaxSeekableProgress,
   getMaxSeekableSeconds,
   progressFromTouchX,
   progressToSeekSeconds,
} from '@/utils/playbackPosition';

describe('playbackPosition utils', () => {
   describe('clampPlaybackSeekSeconds', () => {
      it('returns 0 for non-positive input', () => {
         expect(clampPlaybackSeekSeconds(0, 936)).toBe(0);
         expect(clampPlaybackSeekSeconds(-5, 936)).toBe(0);
      });

      it('stays slightly before chapter duration for end seeks', () => {
         expect(clampPlaybackSeekSeconds(936, 936)).toBe(935.75);
      });

      it('does not change mid-chapter positions', () => {
         expect(clampPlaybackSeekSeconds(120.5, 936)).toBe(120.5);
      });
   });

   describe('clampSyncPlaybackPosition', () => {
      it('caps seek sync strictly before duration', () => {
         expect(clampSyncPlaybackPosition(936, 936, 'seek')).toBe(935);
         expect(clampSyncPlaybackPosition(936.9, 936.2, 'seek')).toBe(935);
      });

      it('allows pause sync at chapter duration', () => {
         expect(clampSyncPlaybackPosition(936, 936, 'pause')).toBe(936);
      });

      it('allows play sync up to duration floor', () => {
         expect(clampSyncPlaybackPosition(120, 936, 'play')).toBe(120);
      });
   });

   describe('getMaxSeekableSeconds', () => {
      it('returns duration minus margin for positive duration', () => {
         expect(getMaxSeekableSeconds(936)).toBe(935.75);
      });

      it('returns 0 for invalid duration', () => {
         expect(getMaxSeekableSeconds(0)).toBe(0);
      });
   });

   describe('getMaxSeekableProgress', () => {
      it('is less than 1 for typical chapters', () => {
         const progress = getMaxSeekableProgress(936);
         expect(progress).toBeLessThan(1);
         expect(progress).toBeGreaterThan(0.99);
      });

      it('returns 0 when duration is invalid', () => {
         expect(getMaxSeekableProgress(0)).toBe(0);
      });
   });

   describe('progressFromTouchX', () => {
      it('maps touch to proportional progress', () => {
         expect(progressFromTouchX(0, 300)).toBe(0);
         expect(progressFromTouchX(150, 300)).toBe(0.5);
         expect(progressFromTouchX(300, 300)).toBe(1);
      });

      it('clamps overflow and guards invalid width', () => {
         expect(progressFromTouchX(400, 300)).toBe(1);
         expect(progressFromTouchX(-10, 300)).toBe(0);
         expect(progressFromTouchX(100, 0)).toBe(0);
      });
   });

   describe('progressToSeekSeconds', () => {
      it('caps full progress below chapter duration', () => {
         expect(progressToSeekSeconds(1, 936)).toBe(935.75);
         expect(progressToSeekSeconds(1, 936)).toBe(getMaxSeekableSeconds(936));
      });

      it('preserves mid-chapter positions', () => {
         expect(progressToSeekSeconds(0.5, 936)).toBe(468);
      });
   });

   describe('clampScrubProgress', () => {
      it('never exceeds max seekable progress', () => {
         expect(clampScrubProgress(1, 936)).toBe(getMaxSeekableProgress(936));
         expect(clampScrubProgress(1.5, 936)).toBe(getMaxSeekableProgress(936));
      });
   });
});
