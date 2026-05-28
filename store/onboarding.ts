/**
 * Signup wizard draft state (in-memory across onboarding screens)
 */

import { create } from 'zustand';

export const GENDER_OPTIONS = [
   { value: 'male', label: 'Male' },
   { value: 'female', label: 'Female' },
   { value: 'non_binary', label: 'Non-binary' },
   { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]['value'];

export const MIN_AGE = 13;
export const MAX_AGE = 120;
export const MAX_GENRE_SELECTIONS = 3;

interface OnboardingState {
   age: number | null;
   gender: GenderValue | null;
   genreIds: string[];
   setAge: (age: number | null) => void;
   setGender: (gender: GenderValue | null) => void;
   toggleGenreId: (genreId: string) => void;
   resetOnboarding: () => void;
}

const initialState = {
   age: null as number | null,
   gender: null as GenderValue | null,
   genreIds: [] as string[],
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
   ...initialState,
   setAge: (age) => set({ age }),
   setGender: (gender) => set({ gender }),
   toggleGenreId: (genreId) => {
      const { genreIds } = get();
      if (genreIds.includes(genreId)) {
         set({ genreIds: genreIds.filter((id) => id !== genreId) });
         return;
      }
      if (genreIds.length >= MAX_GENRE_SELECTIONS) {
         return;
      }
      set({ genreIds: [...genreIds, genreId] });
   },
   resetOnboarding: () => set(initialState),
}));
