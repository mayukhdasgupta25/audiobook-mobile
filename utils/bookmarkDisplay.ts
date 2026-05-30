import type { Bookmark } from '@/services/bookmarks';

export function getBookmarkAudiobookId(bookmark: Bookmark): string | undefined {
   return (
      bookmark.chapter?.audiobookId ??
      bookmark.chapter?.audiobook?.id
   );
}

export function getBookmarkChapterTitle(bookmark: Bookmark): string {
   return bookmark.chapter?.title ?? 'Chapter';
}

export function getBookmarkAudiobookTitle(bookmark: Bookmark): string | undefined {
   return (
      bookmark.chapter?.audiobookTitle ??
      bookmark.chapter?.audiobook?.title
   );
}

export function getBookmarkCoverPath(bookmark: Bookmark): string | undefined {
   const chapter = bookmark.chapter;
   if (!chapter) return undefined;
   return (
      chapter.chapterCardCoverImage ??
      chapter.coverImage ??
      chapter.audiobook?.contentCardCoverImage ??
      chapter.audiobook?.coverImage ??
      undefined
   ) ?? undefined;
}

export function getBookmarkChapterLabel(bookmark: Bookmark): string | undefined {
   const num = bookmark.chapter?.chapterNumber;
   if (num == null) return undefined;
   return `Ch. ${num}`;
}
