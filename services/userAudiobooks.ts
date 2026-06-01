/**
 * User audiobooks service — titles and listening progress per user profile
 */

import { get, ApiError, API_V1_PATH } from './api';

export interface UserAudiobook {
   id: string;
   userProfileId: string;
   audiobookId: string;
   type?: string;
   /** Total listening time for this title, in seconds (decimal float) */
   progress: number;
   createdAt?: string;
   updatedAt?: string;
}

export interface UserAudiobooksListResponse {
   success: boolean;
   data: UserAudiobook[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

/**
 * GET /api/v1/user-audiobooks/user/{userProfileId}
 */
export async function getUserAudiobooksByProfileId(
   userProfileId: string
): Promise<UserAudiobook[]> {
   try {
      const response = await get<UserAudiobooksListResponse>(
         `${API_V1_PATH}/user-audiobooks/user/${encodeURIComponent(userProfileId)}`,
         true
      );
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
         `Failed to fetch user audiobooks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
