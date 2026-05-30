import {
   getCommentAuthorLabel,
   getCommentAvatarUri,
   isOwnComment,
} from '@/utils/commentAuthor';
import type { Comment } from '@/services/comments';

const baseComment: Comment = {
   id: 'c1',
   userProfileId: 'profile-a',
   audiobookId: 'book-1',
   content: 'Hello',
   createdAt: '2026-05-30T00:00:00.000Z',
   user: {
      firstName: 'Mayukh',
      lastName: 'Dasgupta',
      avatar: '/uploads/avatar.jpg',
   },
};

describe('commentAuthor utils', () => {
   it('shows "You" for the current user profile', () => {
      expect(getCommentAuthorLabel(baseComment, 'profile-a')).toBe('You');
      expect(isOwnComment(baseComment, 'profile-a')).toBe(true);
   });

   it('shows full name for other users', () => {
      expect(getCommentAuthorLabel(baseComment, 'profile-b')).toBe('Mayukh Dasgupta');
   });

   it('falls back when user object is missing', () => {
      const legacy: Comment = {
         ...baseComment,
         user: undefined,
         authorName: 'Legacy Author',
      };
      expect(getCommentAuthorLabel(legacy, 'profile-b')).toBe('Legacy Author');
   });

   it('resolves avatar path for comment authors', () => {
      const uri = getCommentAvatarUri(baseComment, 'profile-b', null);
      expect(uri).toContain('/uploads/avatar.jpg');
   });
});
