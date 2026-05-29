/**
 * Determines whether the user still needs the signup profile wizard.
 */

import type { UserProfile } from '@/services/user';

/**
 * Wizard is required when age, gender, or favorite genres are missing on the profile.
 */
export function isOnboardingProfileIncomplete(
   profile: UserProfile | null | undefined
): boolean {
   if (!profile) {
      return true;
   }

   const hasAge = profile.age != null && profile.age > 0;
   const hasGender =
      profile.gender != null && String(profile.gender).trim().length > 0;
   const genreIds = profile.preferences?.favoriteGenreIds ?? [];
   const hasGenres = genreIds.length > 0;

   return !hasAge || !hasGender || !hasGenres;
}

/**
 * Normalizes isNewUser-style flags from auth API responses (Google, etc.).
 */
export function parseIsNewUserFlag(payload: Record<string, unknown>): boolean {
   const candidates = [
      payload.isNewUser,
      payload.is_new_user,
      payload.newUser,
      payload.new_user,
   ];

   return candidates.some(
      (value) => value === true || value === 'true' || value === 1 || value === '1'
   );
}
