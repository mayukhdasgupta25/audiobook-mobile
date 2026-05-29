import {
   ageFromScrollOffset,
   buildAgeRange,
   scrollOffsetForAge,
} from '@/utils/agePicker';

describe('agePicker utils', () => {
   const itemHeight = 52;
   const minAge = 13;
   const maxAge = 120;

   it('buildAgeRange returns inclusive sequence', () => {
      expect(buildAgeRange(13, 15)).toEqual([13, 14, 15]);
   });

   it('scrollOffsetForAge maps age to list offset', () => {
      expect(scrollOffsetForAge(25, itemHeight, minAge)).toBe(12 * itemHeight);
   });

   it('ageFromScrollOffset clamps to bounds', () => {
      expect(ageFromScrollOffset(-100, itemHeight, minAge, maxAge)).toBe(minAge);
      expect(ageFromScrollOffset(99999, itemHeight, minAge, maxAge)).toBe(maxAge);
      expect(ageFromScrollOffset(12 * itemHeight, itemHeight, minAge, maxAge)).toBe(25);
   });
});
