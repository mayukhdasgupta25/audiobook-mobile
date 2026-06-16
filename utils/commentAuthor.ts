import type { Comment, CommentUser } from '@/services/comments';
import { resolveAvatarUrl } from '@/utils/resolveAvatarUrl';

export function isOwnComment(
   comment: Comment,
   currentUserProfileId: string | null | undefined
): boolean {
   return Boolean(
      currentUserProfileId && comment.userProfileId === currentUserProfileId
   );
}

export function getCommentAuthorLabel(
   comment: Comment,
   currentUserProfileId: string | null | undefined
): string {
   if (isOwnComment(comment, currentUserProfileId)) {
      return 'You';
   }

   const name = formatCommentUserName(comment.user);
   if (name) {
      return name;
   }

   return comment.authorName ?? comment.userName ?? 'Listener';
}

export function formatCommentUserName(user: CommentUser | undefined): string | null {
   if (!user) {
      return null;
   }
   const parts = [user.firstName, user.lastName].filter(
      (part): part is string => Boolean(part?.trim())
   );
   return parts.length > 0 ? parts.join(' ') : null;
}

export function getCommentAuthorInitials(label: string, user?: CommentUser): string {
   if (user) {
      const parts = [user.firstName, user.lastName].filter(
         (part): part is string => Boolean(part?.trim())
      );
      if (parts.length >= 2) {
         return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      if (parts.length === 1) {
         return parts[0].substring(0, 2).toUpperCase();
      }
   }

   const names = label.trim().split(/\s+/);
   if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
   }
   return label.substring(0, 2).toUpperCase() || '?';
}

export function getCommentAvatarUri(
   comment: Comment,
   currentUserProfileId: string | null | undefined,
   currentUserAvatar: string | null | undefined,
   currentUserImageAssets?: CommentUser['imageAssets']
): string | undefined {
   const isOwn = isOwnComment(comment, currentUserProfileId);
   const avatarPath = isOwn
      ? currentUserAvatar ?? comment.user?.avatar ?? null
      : comment.user?.avatar ?? null;
   const imageAssets = isOwn
      ? currentUserImageAssets ?? comment.user?.imageAssets
      : comment.user?.imageAssets;

   return resolveAvatarUrl(avatarPath, imageAssets);
}
