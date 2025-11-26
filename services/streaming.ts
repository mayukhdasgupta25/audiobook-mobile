/**
 * Streaming service
 * Handles M3U8 playlist API calls for audio streaming
 * Note: Segment fetching is now handled automatically by react-native-video via native HLS support
 */

import { Platform } from 'react-native';
import { get, ApiError, API_V1_STREAM_PATH } from './api';

/**
 * Get master playlist for a chapter (platform-specific)
 * - iOS: Calls GET {API_V1_STREAM_PATH}/chapters/:chapterId/master.m3u8
 * - Other platforms: Calls GET {API_V1_STREAM_PATH}/chapters/:chapterId/manifest.mpd
 * @param chapterId - Chapter ID
 * @returns Promise with raw playlist content as string
 * @throws ApiError if request fails
 */
export async function getMasterPlaylist(
   chapterId: string
): Promise<string> {
   try {
      // iOS uses master.m3u8, other platforms use manifest.mpd
      const endpoint = Platform.OS === 'ios'
         ? `${API_V1_STREAM_PATH}/chapters/${chapterId}/master.m3u8`
         : `${API_V1_STREAM_PATH}/chapters/${chapterId}/manifest.mpd`;

      const response = await get<string>(
         endpoint,
         true, // Use authentication
         false, // Not using auth API
         true // Use streaming API
      );
      return response.data;
   } catch (error) {
      console.warn('[Streaming Service] Get master playlist error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         chapterId,
         platform: Platform.OS,
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
 * Calls GET {API_V1_STREAM_PATH}/chapters/:chapterId/:bitrate/playlist.m3u8?user=userId with Bearer token
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
         `${API_V1_STREAM_PATH}/chapters/${chapterId}/${bitrate}/playlist.m3u8?user=${userId}`,
         true, // Use authentication
         false, // Not using auth API
         true // Use streaming API
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


