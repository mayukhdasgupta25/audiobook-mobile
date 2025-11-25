/**
 * M3U8 Playlist Parser
 * Parses M3U8 master and detailed playlists for audio streaming
 */

/**
 * Stream info from master playlist
 */
export interface StreamInfo {
   bandwidth: number; // in bits per second (e.g., 128000 for 128k)
   codecs?: string;
   resolution?: string;
   playlistPath: string; // relative path to the playlist
}

/**
 * Segment info from detailed playlist
 */
export interface SegmentInfo {
   duration: number; // in seconds
   path: string; // relative path to the segment file
   segmentId: string; // extracted segment ID (e.g., "segment_000" from "bit_transcode/chapterId/128k/segment_000.ts")
}

/**
 * Parsed master playlist data
 */
export interface MasterPlaylistData {
   version?: number;
   streams: StreamInfo[];
}

/**
 * Parsed detailed playlist data
 */
export interface PlaylistData {
   version?: number;
   targetDuration?: number;
   segments: SegmentInfo[];
   isEndList: boolean;
   initSegmentUri?: string; // URI for init segment (for fragmented MP4)
}

/**
 * Parse master M3U8 playlist
 * Extracts stream information including bitrate, codecs, and playlist paths
 * 
 * @param m3u8Content - Raw M3U8 content as string
 * @returns Parsed master playlist data with stream information
 * 
 * @example
 * const content = `#EXTM3U
 * #EXT-X-VERSION: 3
 * #EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"
 * bit_transcode/chapterId/128k/playlist.m3u8`;
 * const parsed = parseMasterPlaylist(content);
 */
export function parseMasterPlaylist(m3u8Content: string): MasterPlaylistData {
   const lines = m3u8Content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
   const streams: StreamInfo[] = [];
   let version: number | undefined;

   // Parse version
   const versionLine = lines.find((line) => line.startsWith('#EXT-X-VERSION:'));
   if (versionLine) {
      const versionMatch = versionLine.match(/#EXT-X-VERSION:\s*(\d+)/);
      if (versionMatch) {
         version = parseInt(versionMatch[1], 10);
      }
   }

   // Parse stream info
   for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXT-X-STREAM-INF:')) {
         // Extract attributes from EXT-X-STREAM-INF tag
         const attributes: Record<string, string> = {};

         // Parse BANDWIDTH, CODECS, RESOLUTION, etc.
         const attrMatches = line.matchAll(/(\w+)="?([^",\s]+)"?/g);
         for (const match of attrMatches) {
            attributes[match[1]] = match[2];
         }

         // Get the playlist path from the next line
         const playlistPath = i + 1 < lines.length && !lines[i + 1].startsWith('#')
            ? lines[i + 1]
            : '';

         if (playlistPath && attributes.BANDWIDTH) {
            // Normalize path: convert backslashes to forward slashes
            const normalizedPath = playlistPath.replace(/\\/g, '/');

            const bandwidth = parseInt(attributes.BANDWIDTH, 10);
            streams.push({
               bandwidth,
               codecs: attributes.CODECS,
               resolution: attributes.RESOLUTION,
               playlistPath: normalizedPath,
            });
         }
      }
   }

   return {
      version,
      streams,
   };
}

/**
 * Parse detailed M3U8 playlist
 * Extracts segment information including duration and file paths
 * 
 * @param m3u8Content - Raw M3U8 content as string
 * @returns Parsed playlist data with segment information
 * 
 * @example
 * const content = `#EXTM3U
 * #EXT-X-VERSION: 3
 * #EXT-X-TARGETDURATION: 10
 * #EXTINF: 10.0,
 * bit_transcode/chapterId/128k/segment_000.ts`;
 * const parsed = parsePlaylist(content);
 */
export function parsePlaylist(m3u8Content: string): PlaylistData {
   const lines = m3u8Content.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
   const segments: SegmentInfo[] = [];
   let version: number | undefined;
   let targetDuration: number | undefined;
   let isEndList = false;

   // Parse version
   const versionLine = lines.find((line) => line.startsWith('#EXT-X-VERSION:'));
   if (versionLine) {
      const versionMatch = versionLine.match(/#EXT-X-VERSION:\s*(\d+)/);
      if (versionMatch) {
         version = parseInt(versionMatch[1], 10);
      }
   }

   // Parse target duration
   const targetDurationLine = lines.find((line) => line.startsWith('#EXT-X-TARGETDURATION:'));
   if (targetDurationLine) {
      const durationMatch = targetDurationLine.match(/#EXT-X-TARGETDURATION:\s*(\d+)/);
      if (durationMatch) {
         targetDuration = parseInt(durationMatch[1], 10);
      }
   }

   // Parse init segment (EXT-X-MAP) for fragmented MP4
   // Format: #EXT-X-MAP:URI="init.mp4" or #EXT-X-MAP:URI="bit_transcode\path\init.mp4"
   let initSegmentUri: string | undefined;
   const mapLine = lines.find((line) => line.startsWith('#EXT-X-MAP:'));
   if (mapLine) {
      // Match URI="..." where ... can contain backslashes
      const uriMatch = mapLine.match(/URI="([^"]+)"/);
      if (uriMatch) {
         // Normalize path: convert backslashes to forward slashes (fix server-side path issues)
         // Example: "bit_transcode\chapterId\128k\init.mp4" -> "bit_transcode/chapterId/128k/init.mp4"
         initSegmentUri = uriMatch[1].replace(/\\/g, '/');
      }
   }

   // Check for end list
   isEndList = lines.some((line) => line === '#EXT-X-ENDLIST');

   // Parse segments
   for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTINF:')) {
         // Extract duration from EXTINF tag
         // Format: #EXTINF: 10.0, or #EXTINF:10.0,
         const durationMatch = line.match(/#EXTINF:\s*([\d.]+)/);
         const duration = durationMatch ? parseFloat(durationMatch[1]) : 0;

         // Get the segment path from the next line
         const segmentPath = i + 1 < lines.length && !lines[i + 1].startsWith('#')
            ? lines[i + 1]
            : '';

         if (segmentPath) {
            // Normalize path: convert backslashes to forward slashes (fix server-side path issues)
            const normalizedPath = segmentPath.replace(/\\/g, '/');

            // Extract segmentId from path (e.g., "segment_000" from "bit_transcode/chapterId/128k/segment_000.ts")
            const segmentId = extractSegmentId(normalizedPath);
            segments.push({
               duration,
               path: normalizedPath,
               segmentId,
            });
         }
      }
   }

   return {
      version,
      targetDuration,
      segments,
      isEndList,
      initSegmentUri,
   };
}

/**
 * Extract segment ID from segment path
 * @param segmentPath - Full path to segment file (e.g., "bit_transcode/chapterId/128k/segment_000.ts")
 * @returns Segment ID with extension (e.g., "segment_000.ts")
 */
export function extractSegmentId(segmentPath: string): string {
   // Extract filename from path (handles both / and \ separators)
   const filename = segmentPath.split(/[/\\]/).pop() || '';
   // Return filename with extension (API expects segment_000.ts format)
   return filename;
}

/**
 * Get bitrate in kbps from bandwidth
 * @param bandwidth - Bandwidth in bits per second
 * @returns Bitrate in kbps (e.g., 128 for 128k)
 */
export function getBitrateInKbps(bandwidth: number): number {
   return Math.round(bandwidth / 1000);
}

/**
 * Find stream by bitrate (in kbps)
 * @param streams - Array of stream info
 * @param targetBitrateKbps - Target bitrate in kbps (e.g., 128 for 128k)
 * @returns Stream info matching the bitrate, or undefined if not found
 */
export function findStreamByBitrate(
   streams: StreamInfo[],
   targetBitrateKbps: number
): StreamInfo | undefined {
   return streams.find((stream) => getBitrateInKbps(stream.bandwidth) === targetBitrateKbps);
}

