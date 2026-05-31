import {
   INDIAN_LANGUAGES,
   MAX_LANGUAGE_SELECTIONS,
   shuffleLanguages,
} from '@/constants/indianLanguages';

describe('indianLanguages constants', () => {
   it('lists 23 languages (22 Eighth Schedule + English)', () => {
      expect(INDIAN_LANGUAGES).toHaveLength(23);
   });

   it('includes English', () => {
      expect(INDIAN_LANGUAGES.some((lang) => lang.code === 'en')).toBe(true);
   });

   it('uses unique ISO codes', () => {
      const codes = INDIAN_LANGUAGES.map((lang) => lang.code);
      expect(new Set(codes).size).toBe(codes.length);
   });

   it('allows max 3 language selections', () => {
      expect(MAX_LANGUAGE_SELECTIONS).toBe(3);
   });
});

describe('shuffleLanguages', () => {
   it('returns the same items in a new array', () => {
      const shuffled = shuffleLanguages(INDIAN_LANGUAGES);
      expect(shuffled).toHaveLength(INDIAN_LANGUAGES.length);
      expect(shuffled.sort((a, b) => a.code.localeCompare(b.code))).toEqual(
         [...INDIAN_LANGUAGES].sort((a, b) => a.code.localeCompare(b.code))
      );
   });

   it('can produce a different order than the original', () => {
      const originalOrder = INDIAN_LANGUAGES.map((lang) => lang.code).join(',');
      let foundDifferentOrder = false;

      for (let attempt = 0; attempt < 20; attempt += 1) {
         const shuffledOrder = shuffleLanguages(INDIAN_LANGUAGES)
            .map((lang) => lang.code)
            .join(',');
         if (shuffledOrder !== originalOrder) {
            foundDifferentOrder = true;
            break;
         }
      }

      expect(foundDifferentOrder).toBe(true);
   });
});
