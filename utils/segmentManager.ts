/**
 * Segment Manager Utility
 * Handles fetching audio segments and saving them as temporary files for playback
 */

import { File, Paths } from 'expo-file-system';
import { getSegment } from '@/services/streaming';

/**
 * Cache for fetched segments
 * Key: chapterId-segmentId-bitrate, Value: file URI
 */
const segmentCache = new Map<string, string>();

/**
 * Fetch segment and save as temporary file
 * @param chapterId - Chapter ID
 * @param segmentId - Segment ID (e.g., "segment_000.ts")
 * @param bitrate - Bitrate (e.g., "128")
 * @param userId - User ID
 * @returns Promise with file URI that can be used with react-native-video
 */
export async function fetchSegmentAsFile(
   chapterId: string,
   segmentId: string,
   bitrate: string,
   userId: string
): Promise<string> {
   const cacheKey = `${chapterId}-${segmentId}-${bitrate}`;

   // Check cache first
   if (segmentCache.has(cacheKey)) {
      const cachedUri = segmentCache.get(cacheKey);
      if (cachedUri) {
         // Verify file still exists
         try {
            const file = new File(cachedUri);
            if (file.exists) {
               return cachedUri;
            } else {
               // Remove from cache if file doesn't exist
               segmentCache.delete(cacheKey);
            }
         } catch {
            // Remove from cache if file path is invalid
            segmentCache.delete(cacheKey);
         }
      }
   }

   try {
      // Fetch segment as ArrayBuffer from API
      const arrayBuffer = await getSegment(chapterId, bitrate, segmentId, userId);

      // Convert ArrayBuffer to Uint8Array (binary data)
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create file in cache directory using expo-file-system v19 API
      // Save as .ts file (MPEG-TS format) - react-native-video supports this
      const fileName = `${chapterId}_${segmentId.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
      const file = new File(Paths.cache, fileName);

      // Create the file first (with overwrite option to replace if exists)
      try {
         file.create({ overwrite: true, intermediates: true });
      } catch (createError) {
         // File might already exist, try to write anyway
         console.log('[Segment Manager] File might already exist, continuing...');
      }

      // Write binary data directly to file
      file.write(uint8Array);

      // Cache the URI
      segmentCache.set(cacheKey, file.uri);

      return file.uri;
   } catch (error) {
      console.error('[Segment Manager] Error fetching segment:', {
         error,
         chapterId,
         segmentId,
         userId,
      });
      throw error;
   }
}

/**
 * Pre-fetch next segment
 * @param chapterId - Chapter ID
 * @param segmentId - Segment ID to pre-fetch
 * @param bitrate - Bitrate (e.g., "128")
 * @param userId - User ID
 * @returns Promise that resolves when segment is cached
 */
export async function preFetchSegment(
   chapterId: string,
   segmentId: string,
   bitrate: string,
   userId: string
): Promise<void> {
   const cacheKey = `${chapterId}-${segmentId}-${bitrate}`;

   // Skip if already cached
   if (segmentCache.has(cacheKey)) {
      return;
   }

   try {
      // Fetch and cache segment in background
      await fetchSegmentAsFile(chapterId, segmentId, bitrate, userId);
   } catch (error) {
      // Log error but don't throw - pre-fetch failures shouldn't block playback
      console.warn('[Segment Manager] Pre-fetch failed:', {
         error,
         chapterId,
         segmentId,
      });
   }
}

/**
 * Clear segment cache
 * @param chapterId - Optional chapter ID to clear specific chapter's segments
 */
export function clearSegmentCache(chapterId?: string): void {
   if (chapterId) {
      // Clear only segments for this chapter
      const keysToDelete: string[] = [];
      segmentCache.forEach((_, key) => {
         if (key.startsWith(`${chapterId}-`)) {
            keysToDelete.push(key);
         }
      });
      keysToDelete.forEach((key) => segmentCache.delete(key));
   } else {
      // Clear all cached segments
      segmentCache.clear();
   }
}

/**
 * Get cached segment URI if available
 * @param chapterId - Chapter ID
 * @param segmentId - Segment ID
 * @param bitrate - Bitrate
 * @returns Cached URI or null if not cached
 */
export function getCachedSegmentUri(
   chapterId: string,
   segmentId: string,
   bitrate: string
): string | null {
   const cacheKey = `${chapterId}-${segmentId}-${bitrate}`;
   return segmentCache.get(cacheKey) || null;
}

