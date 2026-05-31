import {
   normalizeMoodKey,
   getMoodIconComponent,
   getMoodAttributeIconComponent,
   normalizeHexCode,
   hexToRgba,
   toSentenceCase,
} from '@/utils/moodAssets';

describe('moodAssets utils', () => {
   it('normalizes mood keys to kebab-case slugs', () => {
      expect(normalizeMoodKey(undefined)).toBe('');
      expect(normalizeMoodKey('Calm')).toBe('calm');
      expect(normalizeMoodKey('Feel Good')).toBe('feel-good');
      expect(normalizeMoodKey('Memory Filled')).toBe('memory-filled');
      expect(normalizeMoodKey('feel_good')).toBe('feel-good');
   });

   it('resolves known mood icons', () => {
      expect(getMoodIconComponent('Calm')).not.toBeNull();
      expect(getMoodIconComponent('Suspenseful')).not.toBeNull();
      expect(getMoodIconComponent('Unknown Mood')).toBeNull();
   });

   it('resolves known attribute icons', () => {
      expect(getMoodAttributeIconComponent('Feel Good')).not.toBeNull();
      expect(getMoodAttributeIconComponent('memory-filled')).not.toBeNull();
      expect(getMoodAttributeIconComponent(undefined)).toBeNull();
      expect(getMoodAttributeIconComponent('Unknown')).toBeNull();
   });

   it('normalizes hex codes', () => {
      expect(normalizeHexCode('3B82F6')).toBe('#3B82F6');
      expect(normalizeHexCode('#3B82F6')).toBe('#3B82F6');
   });

   it('converts hex to rgba', () => {
      expect(hexToRgba('#3B82F6', 0.12)).toBe('rgba(59, 130, 246, 0.12)');
   });

   it('formats labels in sentence case', () => {
      expect(toSentenceCase('Relaxing')).toBe('Relaxing');
      expect(toSentenceCase('FEEL GOOD')).toBe('Feel good');
      expect(toSentenceCase('memory-filled')).toBe('Memory filled');
   });
});
