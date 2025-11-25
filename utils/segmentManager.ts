/**
 * Segment Manager Utility
 * Handles fetching audio segments and saving them as temporary files for playback
 * 
 * NOTE: Fragmented MP4 segments (.m4s) require an initialization segment (init.mp4)
 * to be played. The current implementation plays segments individually, which works
 * for MPEG-TS (.ts) files but may have limitations with fragmented MP4.
 * 
 * For fragmented MP4, consider using HLS streaming directly with react-native-video
 * by providing the master.m3u8 URL, which handles init segments automatically.
 */

import { File, Paths } from 'expo-file-system';
import { getSegment, getInitSegment } from '@/services/streaming';

/**
 * Cache for fetched segments
 * Key: chapterId-segmentId-bitrate, Value: file URI
 */
const segmentCache = new Map<string, string>();

/**
 * Cache for init segments
 * Key: chapterId-bitrate, Value: ArrayBuffer
 */
const initSegmentCache = new Map<string, ArrayBuffer>();

/**
 * Fetch segment and save as temporary file
 * @param chapterId - Chapter ID
 * @param segmentId - Segment ID (e.g., "segment_000.m4s" or "segment_000.ts")
 * @param bitrate - Bitrate (e.g., "128")
 * @param userId - User ID
 * @param initSegmentUri - Optional init segment URI for fragmented MP4 (e.g., "bit_transcode/chapterId/128k/init.mp4")
 * @returns Promise with file URI that can be used with react-native-video
 */
export async function fetchSegmentAsFile(
   chapterId: string,
   segmentId: string,
   bitrate: string,
   userId: string,
   initSegmentUri?: string
): Promise<string> {
   const cacheKey = `${chapterId}-${segmentId}-${bitrate}`;

   console.log('[Segment Manager] fetchSegmentAsFile called', {
      chapterId,
      segmentId,
      bitrate,
      cacheKey,
      isCached: segmentCache.has(cacheKey),
   });

   // Check cache first
   if (segmentCache.has(cacheKey)) {
      const cachedUri = segmentCache.get(cacheKey);
      if (cachedUri) {
         // Verify file still exists
         try {
            const file = new File(cachedUri);
            if (file.exists) {
               console.log('[Segment Manager] Returning cached segment', { cacheKey, cachedUri });
               return cachedUri;
            } else {
               // Remove from cache if file doesn't exist
               console.log('[Segment Manager] Cached file does not exist, removing from cache', { cacheKey });
               segmentCache.delete(cacheKey);
            }
         } catch {
            // Remove from cache if file path is invalid
            console.log('[Segment Manager] Invalid cached file path, removing from cache', { cacheKey });
            segmentCache.delete(cacheKey);
         }
      }
   }

   try {
      console.log('[Segment Manager] Fetching segment from API', { chapterId, segmentId, bitrate });
      // Fetch segment as ArrayBuffer from API
      let segmentData = await getSegment(chapterId, bitrate, segmentId, userId);
      console.log('[Segment Manager] Segment fetched successfully', { chapterId, segmentId, dataSize: segmentData.byteLength });

      // For fragmented MP4 (.m4s), combine with init segment if available
      const isFragmentedMp4 = segmentId.endsWith('.m4s');
      if (isFragmentedMp4 && initSegmentUri) {
         // Get or fetch init segment
         const initCacheKey = `${chapterId}-${bitrate}`;
         let initSegmentData: ArrayBuffer;

         if (initSegmentCache.has(initCacheKey)) {
            initSegmentData = initSegmentCache.get(initCacheKey)!;
         } else {
            // Fetch init segment
            initSegmentData = await getInitSegment(chapterId, bitrate, initSegmentUri, userId);
            // Cache it for reuse
            initSegmentCache.set(initCacheKey, initSegmentData);
         }

         // Combine init segment with media segment
         // For fragmented MP4, we need to prepend the init segment
         const initArray = new Uint8Array(initSegmentData);
         const segmentArray = new Uint8Array(segmentData);
         const combinedArray = new Uint8Array(initArray.length + segmentArray.length);
         combinedArray.set(initArray, 0);
         combinedArray.set(segmentArray, initArray.length);

         // Convert back to ArrayBuffer
         segmentData = combinedArray.buffer;
      }

      // Convert ArrayBuffer to Uint8Array (binary data)
      const uint8Array = new Uint8Array(segmentData);

      // Create file in cache directory using expo-file-system v19 API
      // Determine file extension from segmentId (supports both .ts and .m4s)
      // Extract extension from segmentId (e.g., "segment_000.m4s" -> ".m4s")
      const segmentExtension = segmentId.includes('.')
         ? segmentId.substring(segmentId.lastIndexOf('.'))
         : '.ts'; // Default to .ts for backward compatibility

      // Clean segmentId for filename (remove path separators and special chars)
      const cleanSegmentId = segmentId.replace(/[^a-zA-Z0-9._-]/g, '_');
      // For fragmented MP4 with init segment, use .mp4 extension for combined file
      const fileExtension = isFragmentedMp4 && initSegmentUri ? '.mp4' : segmentExtension;
      const fileName = `${chapterId}_${cleanSegmentId.replace(segmentExtension, fileExtension)}`;
      const file = new File(Paths.cache, fileName);

      // Create the file first (with overwrite option to replace if exists)
      try {
         file.create({ overwrite: true, intermediates: true });
      } catch {
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
 * @param initSegmentUri - Optional init segment URI for fragmented MP4
 * @returns Promise that resolves when segment is cached
 */
export async function preFetchSegment(
   chapterId: string,
   segmentId: string,
   bitrate: string,
   userId: string,
   initSegmentUri?: string
): Promise<void> {
   const cacheKey = `${chapterId}-${segmentId}-${bitrate}`;

   // Skip if already cached
   if (segmentCache.has(cacheKey)) {
      return;
   }

   try {
      // Fetch and cache segment in background
      await fetchSegmentAsFile(chapterId, segmentId, bitrate, userId, initSegmentUri);
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

      // Also clear init segment cache for this chapter
      const initKeysToDelete: string[] = [];
      initSegmentCache.forEach((_, key) => {
         if (key.startsWith(`${chapterId}-`)) {
            initKeysToDelete.push(key);
         }
      });
      initKeysToDelete.forEach((key) => initSegmentCache.delete(key));

      console.log('[Segment Manager] Cleared cache for chapter', { chapterId, segmentsCleared: keysToDelete.length, initSegmentsCleared: initKeysToDelete.length });
   } else {
      // Clear all cached segments
      const segmentCount = segmentCache.size;
      const initSegmentCount = initSegmentCache.size;
      segmentCache.clear();
      initSegmentCache.clear();
      console.log('[Segment Manager] Cleared all cache', { segmentsCleared: segmentCount, initSegmentsCleared: initSegmentCount });
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

