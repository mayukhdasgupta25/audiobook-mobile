import {
   getHexLuminance,
   hexToRgba,
   isLowContrastMoodColor,
   resolveMoodDisplayColor,
   resolveMoodTintBackground,
} from '@/utils/moodAssets';

describe('moodAssets contrast helpers', () => {
   const accent = '#C9A882';

   it('computes relative luminance for known hex values', () => {
      expect(getHexLuminance('#FFFFFF')).toBeCloseTo(1, 2);
      expect(getHexLuminance('#000000')).toBeCloseTo(0, 2);
      expect(getHexLuminance('#111111')).toBeLessThan(0.02);
   });

   it('flags low-contrast mood colors only in dark mode', () => {
      expect(isLowContrastMoodColor('#111111', true)).toBe(true);
      expect(isLowContrastMoodColor('#111111', false)).toBe(false);
      expect(isLowContrastMoodColor('#C9A882', true)).toBe(false);
   });

   it('uses accent fallback for mood named Dark in dark mode', () => {
      const resolved = resolveMoodDisplayColor('#111111', {
         isDark: true,
         moodName: 'Dark',
         fallbackAccent: accent,
      });
      expect(resolved).toBe(accent);
   });

   it('lightens low-luminance hex in dark mode', () => {
      const resolved = resolveMoodDisplayColor('#111111', {
         isDark: true,
         fallbackAccent: accent,
      });
      expect(getHexLuminance(resolved)).toBeGreaterThan(getHexLuminance('#111111'));
      expect(getHexLuminance(resolved)).toBeGreaterThanOrEqual(0.35);
   });

   it('returns normalized hex unchanged in light mode', () => {
      expect(
         resolveMoodDisplayColor('111111', {
            isDark: false,
            moodName: 'Dark',
            fallbackAccent: accent,
         })
      ).toBe('#111111');
   });

   it('boosts pill tint alpha for low-contrast dark-mode moods', () => {
      const normal = resolveMoodTintBackground('#C9A882', {
         isDark: true,
         variant: 'pill',
         fallbackAccent: accent,
      });
      const boosted = resolveMoodTintBackground('#111111', {
         isDark: true,
         moodName: 'Dark',
         variant: 'pill',
         fallbackAccent: accent,
      });

      expect(normal).toBe(hexToRgba('#C9A882', 0.12));
      expect(boosted).toBe(hexToRgba(accent, 0.32));
   });
});
