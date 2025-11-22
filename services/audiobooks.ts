/**
 * Audiobooks service
 * Handles audiobook API calls
 */

import { get, ApiError } from './api';

/**
 * Tag interface matching API response
 */
export interface Tag {
   id: string;
   name: string;
   type: string;
   createdAt: string;
   updatedAt: string;
}

/**
 * Genre interface matching API response
 */
export interface Genre {
   id: string;
   name: string;
   createdAt: string;
   updatedAt: string;
}

/**
 * Audiobook tag interface (used in Audiobook)
 */
export interface AudiobookTag {
   name: string;
   type: string;
}

/**
 * Audiobook interface matching API response structure
 */
export interface Audiobook {
   id: string;
   title: string;
   author: string;
   narrator: string;
   description: string;
   duration: number;
   fileSize: number;
   coverImage: string;
   language: string;
   publisher: string;
   publishDate: string;
   isbn: string;
   isActive: boolean;
   isPublic: boolean;
   createdAt: string;
   updatedAt: string;
   audiobookTags: AudiobookTag[];
   genre: Genre;
}

/**
 * Pagination information interface
 */
export interface PaginationInfo {
   currentPage: number;
   totalPages: number;
   totalItems: number;
   itemsPerPage: number;
   hasNextPage: boolean;
   hasPreviousPage: boolean;
}

/**
 * Audiobooks API response interface
 */
export interface AudiobooksResponse {
   success: boolean;
   data: Audiobook[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
   pagination: PaginationInfo;
}

/**
 * Tags API response interface
 */
export interface TagsResponse {
   success: boolean;
   data: Tag[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

/**
 * Genres API response interface
 */
export interface GenresResponse {
   success: boolean;
   data: Genre[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

/**
 * Get tags
 * Calls GET /api/v1/tags with Bearer token
 * @returns Promise with tags response
 * @throws ApiError if request fails
 */
export async function getTags(): Promise<TagsResponse> {
   try {
      const response = await get<TagsResponse>('/api/v1/tags', true); // Use authentication
      return response.data;
   } catch (error) {
      console.warn('[Audiobooks Service] Get tags error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get genres
 * Calls GET /api/v1/genres with Bearer token
 * @returns Promise with genres response
 * @throws ApiError if request fails
 */
export async function getGenres(): Promise<GenresResponse> {
   try {
      const response = await get<GenresResponse>('/api/v1/genres', true); // Use authentication
      return response.data;
   } catch (error) {
      console.warn('[Audiobooks Service] Get genres error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch genres: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get audiobooks by tag with pagination
 * Calls GET /api/v1/audiobooks/tags/{tagName}?page={page} with Bearer token
 * @param tagName - Tag name (e.g., "New Releases", "Trending")
 * @param page - Page number (default: 1)
 * @returns Promise with audiobooks response containing data and pagination info
 * @throws ApiError if request fails
 */
export async function getAudiobooksByTag(
   tagName: string,
   page = 1
): Promise<AudiobooksResponse> {
   try {
      const encodedTagName = encodeURIComponent(tagName);
      const response = await get<AudiobooksResponse>(
         `/api/v1/audiobooks/tags/${encodedTagName}?page=${page}`,
         true // Use authentication
      );
      return response.data;
   } catch (error) {
      console.warn('[Audiobooks Service] Get audiobooks by tag error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         tagName,
         page,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch audiobooks by tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get audiobooks by genre with pagination
 * Calls GET /api/v1/audiobooks/genre/{genreId}?page={page} with Bearer token
 * @param genreId - Genre ID
 * @param page - Page number (default: 1)
 * @returns Promise with audiobooks response containing data and pagination info
 * @throws ApiError if request fails
 */
export async function getAudiobooksByGenre(
   genreId: string,
   page = 1
): Promise<AudiobooksResponse> {
   try {
      const response = await get<AudiobooksResponse>(
         `/api/v1/audiobooks/genre/${genreId}?page=${page}`,
         true // Use authentication
      );
      return response.data;
   } catch (error) {
      console.warn('[Audiobooks Service] Get audiobooks by genre error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         genreId,
         page,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch audiobooks by genre: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get audiobooks with pagination (DEPRECATED - use getAudiobooksByTag or getAudiobooksByGenre)
 * Calls GET /api/v1/audiobooks?page={page} with Bearer token
 * @param page - Page number (default: 1)
 * @returns Promise with audiobooks response containing data and pagination info
 * @throws ApiError if request fails
 * @deprecated Use getAudiobooksByTag or getAudiobooksByGenre instead
 */
export async function getAudiobooks(page = 1): Promise<AudiobooksResponse> {
   try {
      const response = await get<AudiobooksResponse>(
         `/api/v1/audiobooks?page=${page}`,
         true // Use authentication
      );
      return response.data;
   } catch (error) {
      console.warn('[Audiobooks Service] Get audiobooks error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         page,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch audiobooks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

