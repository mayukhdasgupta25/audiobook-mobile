/**
 * User playlists service
 */

import { get, post, put, del, ApiError, API_V1_PATH } from './api';
import { Audiobook } from './audiobooks';

export interface Playlist {
   id: string;
   name: string;
   description: string;
   isPublic: boolean;
   createdAt?: string;
   updatedAt?: string;
}

export interface PlaylistItem {
   id: string;
   playlistId?: string;
   audiobookId: string;
   position: number;
   audiobook?: Audiobook;
   createdAt?: string;
   updatedAt?: string;
}

export interface CreatePlaylistRequest {
   name: string;
   description: string;
   isPublic: false;
}

export interface UpdatePlaylistRequest {
   name: string;
   description: string;
}

export interface AddPlaylistItemRequest {
   audiobookId: string;
   position: number;
}

export interface UpdatePlaylistItemRequest {
   position: number;
}

export interface PlaylistsResponse {
   success: boolean;
   data: Playlist[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface PlaylistResponse {
   success: boolean;
   data: Playlist;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface PlaylistItemsResponse {
   success: boolean;
   data: PlaylistItem[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface PlaylistItemResponse {
   success: boolean;
   data: PlaylistItem;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface GetPlaylistsParams {
   limit?: number;
}

function buildPlaylistsQuery(params?: GetPlaylistsParams): string {
   if (params?.limit == null) return '';
   const search = new URLSearchParams();
   search.set('limit', String(params.limit));
   return `?${search.toString()}`;
}

export async function getPlaylists(
   params?: GetPlaylistsParams
): Promise<PlaylistsResponse> {
   try {
      const response = await get<PlaylistsResponse>(
         `${API_V1_PATH}/playlists${buildPlaylistsQuery(params)}`,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch playlists: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function createPlaylist(
   name: string,
   description: string
): Promise<PlaylistResponse> {
   const body: CreatePlaylistRequest = {
      name,
      description,
      isPublic: false,
   };
   try {
      const response = await post<PlaylistResponse>(
         `${API_V1_PATH}/playlists`,
         body,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function updatePlaylist(
   playlistId: string,
   request: UpdatePlaylistRequest
): Promise<PlaylistResponse> {
   try {
      const response = await put<PlaylistResponse>(
         `${API_V1_PATH}/playlists/${playlistId}`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to update playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function deletePlaylist(playlistId: string): Promise<void> {
   try {
      await del(`${API_V1_PATH}/playlists/${playlistId}`, true);
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to delete playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function getPlaylistItems(
   playlistId: string
): Promise<PlaylistItemsResponse> {
   try {
      const response = await get<PlaylistItemsResponse>(
         `${API_V1_PATH}/playlists/${playlistId}/items`,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch playlist items: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function addPlaylistItem(
   playlistId: string,
   request: AddPlaylistItemRequest
): Promise<PlaylistItemResponse> {
   try {
      const response = await post<PlaylistItemResponse>(
         `${API_V1_PATH}/playlists/${playlistId}/items`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to add playlist item: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function updatePlaylistItem(
   playlistId: string,
   itemId: string,
   request: UpdatePlaylistItemRequest
): Promise<PlaylistItemResponse> {
   try {
      const response = await put<PlaylistItemResponse>(
         `${API_V1_PATH}/playlists/${playlistId}/items/${itemId}`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to update playlist item: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function deletePlaylistItem(
   playlistId: string,
   itemId: string
): Promise<void> {
   try {
      await del(
         `${API_V1_PATH}/playlists/${playlistId}/items/${itemId}`,
         true
      );
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to remove playlist item: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
