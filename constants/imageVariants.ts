/**
 * Image variant keys aligned with backend ImagePlaceholderSpec seeds.
 */

export type ImageAssetsMap = Record<string, string>;

export const AUDIOBOOK_VARIANTS = {
   portrait_7_10: 'portrait_7_10',
   portrait_3_4: 'portrait_3_4',
   square_88: 'square_88',
   square_64: 'square_64',
   square_56: 'square_56',
   square_48: 'square_48',
} as const;

export const CHAPTER_VARIANTS = {
   square_960: 'square_960',
   square_56: 'square_56',
   landscape_20_11: 'landscape_20_11',
} as const;

export const USER_VARIANTS = {
   square_120: 'square_120',
   square_64: 'square_64',
} as const;

export const ORGANIZATION_VARIANTS = {
   square_512: 'square_512',
} as const;

export type AudiobookImageSlot =
   | 'gridCard'
   | 'contentRow'
   | 'detailsHero'
   | 'detailsThumb'
   | 'listRow'
   | 'continueListening'
   | 'popularStory';

export type ChapterImageSlot = 'playerMaximized' | 'playerMinimized' | 'bookmarkCard';

export type UserImageSlot = 'profileLarge' | 'profileCompact';

export type OrganizationImageSlot = 'logo';

export const AUDIOBOOK_IMAGE_SLOT_VARIANT: Record<AudiobookImageSlot, string> = {
   gridCard: AUDIOBOOK_VARIANTS.portrait_7_10,
   contentRow: AUDIOBOOK_VARIANTS.portrait_7_10,
   detailsHero: AUDIOBOOK_VARIANTS.portrait_7_10,
   detailsThumb: AUDIOBOOK_VARIANTS.square_88,
   listRow: AUDIOBOOK_VARIANTS.square_56,
   continueListening: AUDIOBOOK_VARIANTS.square_64,
   popularStory: AUDIOBOOK_VARIANTS.portrait_3_4,
};

export const CHAPTER_IMAGE_SLOT_VARIANT: Record<ChapterImageSlot, string> = {
   playerMaximized: CHAPTER_VARIANTS.square_960,
   playerMinimized: CHAPTER_VARIANTS.square_56,
   bookmarkCard: CHAPTER_VARIANTS.square_56,
};

export const USER_IMAGE_SLOT_VARIANT: Record<UserImageSlot, string> = {
   profileLarge: USER_VARIANTS.square_120,
   profileCompact: USER_VARIANTS.square_64,
};

export const ORGANIZATION_IMAGE_SLOT_VARIANT: Record<OrganizationImageSlot, string> = {
   logo: ORGANIZATION_VARIANTS.square_512,
};
