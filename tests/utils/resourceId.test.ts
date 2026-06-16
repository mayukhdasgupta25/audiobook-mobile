import { normalizeResourceId } from '@/utils/resourceId';

describe('normalizeResourceId', () => {
   it('returns null for missing or placeholder ids', () => {
      expect(normalizeResourceId(null)).toBeNull();
      expect(normalizeResourceId(undefined)).toBeNull();
      expect(normalizeResourceId('')).toBeNull();
      expect(normalizeResourceId('   ')).toBeNull();
      expect(normalizeResourceId('null')).toBeNull();
      expect(normalizeResourceId('undefined')).toBeNull();
   });

   it('returns trimmed valid ids', () => {
      expect(normalizeResourceId('chapter-1')).toBe('chapter-1');
      expect(normalizeResourceId('  chapter-2  ')).toBe('chapter-2');
   });
});
