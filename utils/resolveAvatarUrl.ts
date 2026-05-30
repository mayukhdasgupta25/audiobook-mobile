import { getMainApiUrl } from '@/services/api';

/** Build a loadable avatar URI from API paths or absolute URLs */
export function resolveAvatarUrl(avatar: string | null | undefined): string | undefined {
   if (!avatar) {
      return undefined;
   }
   if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
   }
   const path = avatar.startsWith('/') ? avatar : `/${avatar}`;
   return `${getMainApiUrl()}${path}`;
}
