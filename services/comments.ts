/**
 * Comments service (audiobook-scoped, threaded)
 */

import { get, post, ApiError, API_V1_PATH } from './api';
import { PaginationInfo } from './audiobooks';
import type { ImageAssetsMap } from '@/constants/imageVariants';

export interface CommentMeta {
   position?: number;
}

export interface CommentUser {
   firstName: string | null;
   lastName: string | null;
   avatar: string | null;
   imageAssets?: ImageAssetsMap;
}

export interface Comment {
   id: string;
   userProfileId: string;
   audiobookId: string;
   content: string;
   parentId?: string | null;
   user?: CommentUser;
   /** @deprecated Prefer user + userProfileId from API */
   userId?: string;
   /** @deprecated Prefer user + userProfileId from API */
   userName?: string;
   /** @deprecated Prefer user + userProfileId from API */
   authorName?: string;
   meta?: CommentMeta | null;
   replyCount?: number;
   createdAt: string;
   updatedAt?: string;
}

export interface CreateCommentRequest {
   audiobookId: string;
   content: string;
   parentId?: string;
   meta?: CommentMeta;
}

export interface CommentsResponse {
   success: boolean;
   data: Comment[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
   pagination?: PaginationInfo;
}

export interface CommentResponse {
   success: boolean;
   data: Comment;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface GetCommentsParams {
   audiobookId: string;
   page?: number;
   parentId?: string;
}

function buildCommentsQuery(params: GetCommentsParams): string {
   const search = new URLSearchParams();
   search.set('audiobookId', params.audiobookId);
   if (params.page != null) {
      search.set('page', String(params.page));
   }
   if (params.parentId) {
      search.set('parentId', params.parentId);
   }
   return search.toString();
}

export async function getComments(
   params: GetCommentsParams
): Promise<CommentsResponse> {
   try {
      const query = buildCommentsQuery(params);
      const response = await get<CommentsResponse>(
         `${API_V1_PATH}/comments?${query}`,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function createComment(
   request: CreateCommentRequest
): Promise<CommentResponse> {
   try {
      const response = await post<CommentResponse>(
         `${API_V1_PATH}/comments`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to create comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
