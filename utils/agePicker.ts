/**
 * Maps scroll offset to a clamped age for the wheel picker.
 */
export function ageFromScrollOffset(
   offsetY: number,
   itemHeight: number,
   minAge: number,
   maxAge: number
): number {
   const index = Math.round(offsetY / itemHeight);
   const age = minAge + index;
   return Math.min(maxAge, Math.max(minAge, age));
}

export function scrollOffsetForAge(age: number, itemHeight: number, minAge: number): number {
   return (age - minAge) * itemHeight;
}

export function buildAgeRange(minAge: number, maxAge: number): number[] {
   const length = maxAge - minAge + 1;
   return Array.from({ length }, (_, index) => minAge + index);
}
