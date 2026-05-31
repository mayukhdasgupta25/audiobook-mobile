/** Shared portrait cover aspect used by ContentCard and AudiobookGridCard. */
export const PORTRAIT_COVER_ASPECT = 0.7;

export function portraitCoverHeight(cardWidth: number): number {
   return Math.round(cardWidth / PORTRAIT_COVER_ASPECT);
}
