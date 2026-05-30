/**
 * Bookmarks service (chapter-scoped)
 */

import { get, post, del, ApiError, API_V1_PATH } from './api';

export interface BookmarkChapterRef {
   audiobookId?: string;
   title?: string;
   chapterNumber?: number;
   audiobookTitle?: string;
   coverImage?: string | null;
   chapterCardCoverImage?: string | null;
   audiobook?: {
      id?: string;
      title?: string;
      author?: string;
      coverImage?: string | null;
      contentCardCoverImage?: string | null;
   };
}

export interface Bookmark {
   id: string;
   chapterId: string;
   chapter?: BookmarkChapterRef;
   createdAt?: string;
   updatedAt?: string;
}

export interface BookmarksListResponse {
   success: boolean;
   data: Bookmark[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface BookmarkResponse {
   success: boolean;
   data: Bookmark;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface CreateBookmarkRequest {
   chapterId: string;
}

export interface GetBookmarksParams {
   chapterId?: string;
   /** Filtered server-side via chapter.audiobookId */
   audiobookId?: string;
   limit?: number;
}

function buildBookmarksQuery(params: GetBookmarksParams): string {
   const search = new URLSearchParams();
   if (params.chapterId) {
      search.set('chapterId', params.chapterId);
   }
   if (params.audiobookId) {
      search.set('audiobookId', params.audiobookId);
   }
   if (params.limit != null) {
      search.set('limit', String(params.limit));
   }
   return search.toString();
}

export async function getBookmarks(
   params: GetBookmarksParams
): Promise<Bookmark[]> {
   try {
      const query = buildBookmarksQuery(params);
      const path = query
         ? `${API_V1_PATH}/bookmarks?${query}`
         : `${API_V1_PATH}/bookmarks`;
      const response = await get<BookmarksListResponse>(path, true);
      const data = response.data.data;
      return Array.isArray(data) ? data : [];
   } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 204)) {
         return [];
      }
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/** Bookmark for a chapter, or null if none */
export async function getBookmarkByChapterId(
   chapterId: string
): Promise<Bookmark | null> {
   const list = await getBookmarks({ chapterId });
   return list.length > 0 ? list[0] : null;
}

export async function createBookmark(
   request: CreateBookmarkRequest
): Promise<BookmarkResponse> {
   try {
      const response = await post<BookmarkResponse>(
         `${API_V1_PATH}/bookmarks`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to create bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
   try {
      await del(`${API_V1_PATH}/bookmarks/${bookmarkId}`, true);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to delete bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
