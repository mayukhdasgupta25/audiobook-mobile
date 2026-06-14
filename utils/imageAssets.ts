/**
 * Resolve image URLs from imageAssets variant maps with legacy field fallbacks.
 */

import { AUTH_API_BASE_URL, getMainApiUrl } from '@/services/api';
import type { Audiobook, Chapter } from '@/services/audiobooks';
import type { Organization } from '@/services/organizations';
import {
   AUDIOBOOK_IMAGE_SLOT_VARIANT,
   CHAPTER_IMAGE_SLOT_VARIANT,
   ORGANIZATION_IMAGE_SLOT_VARIANT,
   USER_IMAGE_SLOT_VARIANT,
   type AudiobookImageSlot,
   type ChapterImageSlot,
   type ImageAssetsMap,
   type OrganizationImageSlot,
   type UserImageSlot,
} from '@/constants/imageVariants';

export type ImageBaseUrl = 'main' | 'auth';

function firstNonEmptyPath(
   ...paths: (string | null | undefined)[]
): string | undefined {
   for (const path of paths) {
      if (path != null && path.trim().length > 0) {
         return path;
      }
   }
   return undefined;
}

/** Build absolute URI from a storage path or URL. */
export function toAbsoluteImageUrl(
   pathOrUrl: string,
   base: ImageBaseUrl = 'main'
): string {
   if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
   }
   const baseUrl = base === 'auth' ? AUTH_API_BASE_URL : getMainApiUrl();
   const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
   return `${baseUrl}${path}`;
}

/** Relative path or URL before base URL is applied. */
export function pickImageAssetPath(
   primaryPath: string | null | undefined,
   imageAssets: ImageAssetsMap | undefined,
   variantKey: string,
   legacyFallbacks: (string | null | undefined)[] = []
): string | undefined {
   return firstNonEmptyPath(imageAssets?.[variantKey], ...legacyFallbacks, primaryPath);
}

/** Build display URI from path or URL (handles absolute URLs from CDN). */
export function toDisplayImageUri(
   pathOrUrl: string | undefined,
   base: ImageBaseUrl = 'main'
): string | undefined {
   if (!pathOrUrl) {
      return undefined;
   }
   return toAbsoluteImageUrl(pathOrUrl, base);
}

/**
 * Pick variant from imageAssets, then legacy fallbacks, then primary path.
 */
export function resolveImageAssetUrl(
   primaryPath: string | null | undefined,
   imageAssets: ImageAssetsMap | undefined,
   variantKey: string,
   legacyFallbacks: (string | null | undefined)[] = [],
   base: ImageBaseUrl = 'main'
): string | undefined {
   const resolvedPath = pickImageAssetPath(
      primaryPath,
      imageAssets,
      variantKey,
      legacyFallbacks
   );
   if (!resolvedPath) {
      return undefined;
   }
   return toAbsoluteImageUrl(resolvedPath, base);
}

export function resolveAudiobookImageUrl(
   book: Pick<
      Audiobook,
      | 'coverImage'
      | 'imageAssets'
      | 'contentCardCoverImage'
      | 'chaptersHeroCoverImage'
      | 'homeHeroCoverImage'
   >,
   slot: AudiobookImageSlot
): string | undefined {
   const variantKey = AUDIOBOOK_IMAGE_SLOT_VARIANT[slot];
   const legacyBySlot: Record<AudiobookImageSlot, (string | null | undefined)[]> = {
      gridCard: [book.contentCardCoverImage],
      contentRow: [book.contentCardCoverImage, book.homeHeroCoverImage],
      detailsHero: [book.chaptersHeroCoverImage, book.homeHeroCoverImage],
      detailsThumb: [book.contentCardCoverImage, book.chaptersHeroCoverImage],
      listRow: [book.contentCardCoverImage],
      continueListening: [book.contentCardCoverImage],
      popularStory: [book.contentCardCoverImage, book.homeHeroCoverImage],
   };

   return resolveImageAssetUrl(
      book.coverImage,
      book.imageAssets,
      variantKey,
      legacyBySlot[slot]
   );
}

export function resolveChapterImagePath(
   chapter: Pick<
      Chapter,
      | 'coverImage'
      | 'imageAssets'
      | 'chapterCardCoverImage'
      | 'maximizedChapterCoverImage'
      | 'minimizedChapterCoverImage'
   >,
   slot: ChapterImageSlot
): string | undefined {
   const variantKey = CHAPTER_IMAGE_SLOT_VARIANT[slot];
   const legacyBySlot: Record<ChapterImageSlot, (string | null | undefined)[]> = {
      playerMaximized: [chapter.maximizedChapterCoverImage, chapter.chapterCardCoverImage],
      playerMinimized: [chapter.minimizedChapterCoverImage, chapter.chapterCardCoverImage],
      bookmarkCard: [chapter.chapterCardCoverImage, chapter.minimizedChapterCoverImage],
   };
   return pickImageAssetPath(
      chapter.coverImage,
      chapter.imageAssets,
      variantKey,
      legacyBySlot[slot]
   );
}

export function resolveChapterImageUrl(
   chapter: Pick<
      Chapter,
      | 'coverImage'
      | 'imageAssets'
      | 'chapterCardCoverImage'
      | 'maximizedChapterCoverImage'
      | 'minimizedChapterCoverImage'
   >,
   slot: ChapterImageSlot
): string | undefined {
   const variantKey = CHAPTER_IMAGE_SLOT_VARIANT[slot];
   const legacyBySlot: Record<ChapterImageSlot, (string | null | undefined)[]> = {
      playerMaximized: [chapter.maximizedChapterCoverImage, chapter.chapterCardCoverImage],
      playerMinimized: [chapter.minimizedChapterCoverImage, chapter.chapterCardCoverImage],
      bookmarkCard: [chapter.chapterCardCoverImage, chapter.minimizedChapterCoverImage],
   };

   return resolveImageAssetUrl(
      chapter.coverImage,
      chapter.imageAssets,
      variantKey,
      legacyBySlot[slot]
   );
}

export interface UserImageSource {
   avatar?: string | null;
   imageAssets?: ImageAssetsMap;
}

export function resolveUserAvatarUrl(
   profile: UserImageSource | null | undefined,
   slot: UserImageSlot = 'profileLarge'
): string | undefined {
   if (!profile) {
      return undefined;
   }
   const variantKey = USER_IMAGE_SLOT_VARIANT[slot];
   return resolveImageAssetUrl(profile.avatar, profile.imageAssets, variantKey);
}

export function resolveOrganizationImageUrl(
   org: Pick<Organization, 'image' | 'imageAssets'> | null | undefined,
   slot: OrganizationImageSlot = 'logo'
): string | undefined {
   if (!org) {
      return undefined;
   }
   const variantKey = ORGANIZATION_IMAGE_SLOT_VARIANT[slot];
   return resolveImageAssetUrl(org.image, org.imageAssets, variantKey, [], 'auth');
}
