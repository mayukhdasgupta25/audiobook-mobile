import type { Bookmark } from '@/services/bookmarks';
import {
   resolveAudiobookImageUrl,
   resolveChapterImageUrl,
} from '@/utils/imageAssets';

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

export function getBookmarkCoverUri(bookmark: Bookmark): string | undefined {
   const chapter = bookmark.chapter;
   if (!chapter) return undefined;

   const chapterUri = resolveChapterImageUrl(
      {
         coverImage: chapter.coverImage ?? '',
         imageAssets: chapter.imageAssets,
         chapterCardCoverImage: chapter.chapterCardCoverImage ?? null,
         maximizedChapterCoverImage: null,
         minimizedChapterCoverImage: null,
      },
      'bookmarkCard'
   );
   if (chapterUri) {
      return chapterUri;
   }

   const audiobook = chapter.audiobook;
   if (!audiobook?.coverImage && !audiobook?.contentCardCoverImage && !audiobook?.imageAssets) {
      return undefined;
   }

   return resolveAudiobookImageUrl(
      {
         coverImage: audiobook.coverImage ?? '',
         imageAssets: audiobook.imageAssets,
         contentCardCoverImage: audiobook.contentCardCoverImage ?? null,
         chaptersHeroCoverImage: null,
         homeHeroCoverImage: null,
      },
      'listRow'
   );
}

/** @deprecated Prefer getBookmarkCoverUri */
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
