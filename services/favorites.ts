/**
 * Favorites service
 */

import { get, post, del, ApiError, API_V1_PATH } from './api';
import type { Audiobook } from './audiobooks';

export interface Favorite {
   id: string;
   audiobookId: string;
   audiobook?: Audiobook;
   createdAt?: string;
   updatedAt?: string;
}

export interface FavoritesListResponse {
   success: boolean;
   data: Favorite[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface FavoriteResponse {
   success: boolean;
   data: Favorite;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface CreateFavoriteRequest {
   audiobookId: string;
}

export interface GetFavoritesParams {
   audiobookId?: string;
   limit?: number;
}

function buildFavoritesQuery(params?: GetFavoritesParams): string {
   const search = new URLSearchParams();
   if (params?.audiobookId) {
      search.set('audiobookId', params.audiobookId);
   }
   if (params?.limit != null) {
      search.set('limit', String(params.limit));
   }
   const query = search.toString();
   return query ? `?${query}` : '';
}

export async function getFavorites(
   params?: GetFavoritesParams
): Promise<Favorite[]> {
   try {
      const response = await get<FavoritesListResponse | FavoriteResponse>(
         `${API_V1_PATH}/favorites${buildFavoritesQuery(params)}`,
         true
      );
      const body = response.data;
      const data = body.data;
      if (Array.isArray(data)) {
         return data;
      }
      return data ? [data as Favorite] : [];
   } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 204)) {
         return [];
      }
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch favorites: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get favorite for an audiobook (null if none)
 */
export async function getFavoriteByAudiobookId(
   audiobookId: string
): Promise<Favorite | null> {
   const list = await getFavorites({ audiobookId });
   return list.length > 0 ? list[0] : null;
}

export async function createFavorite(
   request: CreateFavoriteRequest
): Promise<FavoriteResponse> {
   try {
      const response = await post<FavoriteResponse>(
         `${API_V1_PATH}/favorites`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to add favorite: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function deleteFavorite(favoriteId: string): Promise<void> {
   try {
      await del(`${API_V1_PATH}/favorites/${favoriteId}`, true);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to remove favorite: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
