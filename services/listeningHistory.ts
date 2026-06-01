/**
 * Listening history service
 */

import { get, ApiError, API_V1_PATH } from './api';
import type { Audiobook } from './audiobooks';

export interface ListeningHistoryEntry {
   id: string;
   userProfileId: string;
   audiobookId: string;
   completed: boolean;
   progress?: number;
   lastListenedAt?: string;
   createdAt?: string;
   updatedAt?: string;
   audiobook?: Audiobook;
}

export interface ListeningHistoryListResponse {
   success: boolean;
   data: ListeningHistoryEntry[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

/**
 * GET /api/v1/listening-history/user/{userProfileId}
 */
export async function getListeningHistoryByProfileId(
   userProfileId: string
): Promise<ListeningHistoryEntry[]> {
   try {
      const response = await get<ListeningHistoryListResponse>(
         `${API_V1_PATH}/listening-history/user/${encodeURIComponent(userProfileId)}`,
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
         `Failed to fetch listening history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
