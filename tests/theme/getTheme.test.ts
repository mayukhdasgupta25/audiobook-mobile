import { getTheme, lightColors, darkColors } from '@/theme';

function collectColorKeys(obj: Record<string, unknown>, prefix = ''): string[] {
   const keys: string[] = [];
   for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
         keys.push(...collectColorKeys(value as Record<string, unknown>, path));
      } else {
         keys.push(path);
      }
   }
   return keys.sort();
}

describe('getTheme', () => {
   it('returns light palette for light scheme', () => {
      const theme = getTheme('light');
      expect(theme.colors.background.screen).toBe('#FFFFFF');
      expect(theme.colors.text.primary).toBe('#111111');
   });

   it('returns dark palette for dark scheme', () => {
      const theme = getTheme('dark');
      expect(theme.colors.background.screen).toBe('#0F0F0F');
      expect(theme.colors.text.primary).toBe('#F5F5F5');
   });

   it('light and dark palettes share the same key structure', () => {
      const lightKeys = collectColorKeys(lightColors as unknown as Record<string, unknown>);
      const darkKeys = collectColorKeys(darkColors as unknown as Record<string, unknown>);
      expect(lightKeys).toEqual(darkKeys);
   });

   it('dark theme uses stronger shadow opacity than light', () => {
      const light = getTheme('light');
      const dark = getTheme('dark');
      expect(dark.shadows.sm.shadowOpacity).toBeGreaterThan(light.shadows.sm.shadowOpacity);
   });

   it('dark drawer background is distinct from screen background', () => {
      const dark = getTheme('dark');
      expect(dark.colors.background.drawer).toBe('#4A3828');
      expect(dark.colors.background.drawer).not.toBe(dark.colors.background.screen);
   });
});
