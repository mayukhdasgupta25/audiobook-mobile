import { MAX_LANGUAGE_SELECTIONS } from '@/constants/indianLanguages';
import { MAX_GENRE_SELECTIONS } from '@/store/onboarding';

export { MAX_LANGUAGE_SELECTIONS, MAX_GENRE_SELECTIONS };

export function toggleSelection<T extends string>(
   current: T[],
   value: T,
   maxSelections: number
): T[] {
   if (current.includes(value)) {
      return current.filter((item) => item !== value);
   }
   if (current.length >= maxSelections) {
      return current;
   }
   return [...current, value];
}
