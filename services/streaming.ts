/**
 * Streaming service
 * Handles M3U8 playlist API calls and segment fetching for audio streaming
 */

import { get, ApiError } from './api';

/**
 * Get master M3U8 playlist for a chapter
 * Calls GET /api/v1/stream/chapters/:chapterId/master.m3u8?user=userId with Bearer token
 * @param chapterId - Chapter ID
 * @param userId - User ID
 * @returns Promise with raw M3U8 content as string
 * @throws ApiError if request fails
 */
export async function getMasterPlaylist(
   chapterId: string,
   userId: string
): Promise<string> {
   try {
      const response = await get<string>(
         `/api/v1/stream/chapters/${chapterId}/master.m3u8?user=${userId}`,
         true // Use authentication
      );
      return response.data;
   } catch (error) {
      console.warn('[Streaming Service] Get master playlist error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         chapterId,
         userId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch master playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get detailed M3U8 playlist for a chapter with specific bitrate
 * Calls GET /api/v1/stream/chapters/:chapterId/:bitrate/playlist.m3u8?user=userId with Bearer token
 * @param chapterId - Chapter ID
 * @param bitrate - Bitrate (e.g., "128" for 128k, "64" for 64k)
 * @param userId - User ID
 * @returns Promise with raw M3U8 content as string
 * @throws ApiError if request fails
 */
export async function getPlaylist(
   chapterId: string,
   bitrate: string,
   userId: string
): Promise<string> {
   try {
      const response = await get<string>(
         `/api/v1/stream/chapters/${chapterId}/${bitrate}/playlist.m3u8?user=${userId}`,
         true // Use authentication
      );
      return response.data;
   } catch (error) {
      console.warn('[Streaming Service] Get playlist error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         chapterId,
         bitrate,
         userId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get audio segment for a chapter
 * Calls GET /api/v1/stream/chapters/:chapterId/:bitrate/segments/:segmentId?user=userId with Bearer token
 * @param chapterId - Chapter ID
 * @param bitrate - Bitrate (e.g., "128" for 128k, "64" for 64k)
 * @param segmentId - Segment ID (e.g., "segment_000")
 * @param userId - User ID
 * @returns Promise with segment data as ArrayBuffer (more reliable in React Native than Blob)
 * @throws ApiError if request fails
 */
export async function getSegment(
   chapterId: string,
   bitrate: string,
   segmentId: string,
   userId: string
): Promise<ArrayBuffer> {
   try {
      // For binary data (audio segments), fetch as ArrayBuffer for better React Native compatibility
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { store } = require('@/store');
      const state = store.getState();
      const accessToken = state.auth?.accessToken;

      if (!accessToken) {
         throw new ApiError(401, 'Unauthorized', { message: 'Access token is missing' });
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const baseURL = require('./api').apiConfig.baseURL;
      const url = `${baseURL}/api/v1/stream/chapters/${chapterId}/${bitrate}/segments/${segmentId}?user=${userId}`;

      const now = new Date()
      console.log(`[Streaming Service] Get segment URL ${now.toLocaleTimeString()}`, url);
      const response = await fetch(url, {
         method: 'GET',
         headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'audio/*, application/octet-stream, */*',
         },
      });

      console.log('[Streaming Service] Get segment response', response);

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new ApiError(
            response.status,
            response.statusText,
            errorData
         );
      }

      // Return ArrayBuffer for better React Native compatibility
      // ArrayBuffer is more reliable than Blob in React Native environments
      return await response.arrayBuffer();
   } catch (error) {
      console.warn('[Streaming Service] Get segment error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         chapterId,
         bitrate,
         segmentId,
         userId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch segment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get initialization segment for fragmented MP4
 * Calls GET /api/v1/stream/chapters/:chapterId/:bitrate/segments/:segmentId?user=userId with Bearer token
 * @param chapterId - Chapter ID
 * @param bitrate - Bitrate (e.g., "128" for 128k, "64" for 64k)
 * @param initSegmentPath - Init segment path from playlist (e.g., "bit_transcode/chapterId/128k/init.mp4")
 * @param userId - User ID
 * @returns Promise with init segment data as ArrayBuffer
 * @throws ApiError if request fails
 */
export async function getInitSegment(
   chapterId: string,
   bitrate: string,
   initSegmentPath: string,
   userId: string
): Promise<ArrayBuffer> {
   try {
      // Extract segmentId from path (e.g., "init.mp4" from "bit_transcode/chapterId/128k/init.mp4")
      const segmentId = initSegmentPath.split('/').pop() || 'init.mp4';

      // Use the same getSegment function since init segment is fetched the same way
      return await getSegment(chapterId, bitrate, segmentId, userId);
   } catch (error) {
      console.warn('[Streaming Service] Get init segment error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         chapterId,
         bitrate,
         initSegmentPath,
         userId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch init segment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

