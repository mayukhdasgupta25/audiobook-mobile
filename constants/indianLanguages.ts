/**
 * Official languages of India (22 Eighth Schedule languages + English)
 * ISO 639-1 codes used for API preferences.languages
 */

export interface IndianLanguage {
   code: string;
   label: string;
}

export const MAX_LANGUAGE_SELECTIONS = 3;

/** 22 Eighth Schedule languages plus English (23 total) */
export const INDIAN_LANGUAGES: readonly IndianLanguage[] = [
   { code: 'as', label: 'Assamese' },
   { code: 'bn', label: 'Bengali' },
   { code: 'brx', label: 'Bodo' },
   { code: 'doi', label: 'Dogri' },
   { code: 'en', label: 'English' },
   { code: 'gu', label: 'Gujarati' },
   { code: 'hi', label: 'Hindi' },
   { code: 'kn', label: 'Kannada' },
   { code: 'ks', label: 'Kashmiri' },
   { code: 'kok', label: 'Konkani' },
   { code: 'mai', label: 'Maithili' },
   { code: 'ml', label: 'Malayalam' },
   { code: 'mni', label: 'Manipuri' },
   { code: 'mr', label: 'Marathi' },
   { code: 'ne', label: 'Nepali' },
   { code: 'or', label: 'Odia' },
   { code: 'pa', label: 'Punjabi' },
   { code: 'sa', label: 'Sanskrit' },
   { code: 'sat', label: 'Santhali' },
   { code: 'sd', label: 'Sindhi' },
   { code: 'ta', label: 'Tamil' },
   { code: 'te', label: 'Telugu' },
   { code: 'ur', label: 'Urdu' },
] as const;

/**
 * Fisher–Yates shuffle — returns a new array in random order.
 */
export function shuffleLanguages<T>(languages: readonly T[]): T[] {
   const result = [...languages];
   for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
   }
   return result;
}
