import { resolveUserAvatarUrl, type UserImageSource } from '@/utils/imageAssets';

/** Build a loadable avatar URI from API paths or absolute URLs */
export function resolveAvatarUrl(
   avatar: string | null | undefined,
   imageAssets?: UserImageSource['imageAssets']
): string | undefined {
   return resolveUserAvatarUrl({ avatar, imageAssets }, 'profileLarge');
}
