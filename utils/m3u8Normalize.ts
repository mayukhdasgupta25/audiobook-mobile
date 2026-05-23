/**
 * Fix server-generated M3U8 quirks (backslashes, duplicated path segments) before native playback.
 */

/**
 * Normalize a single media URI from the playlist (segment, init map, etc.).
 */
export function normalizeMediaUri(uri: string): string {
   let fixed = uri.replace(/\\/g, '/');

   // e.g. .../128k/bit_transcode/{id}/128k/segment_000.m4s -> .../128k/segment_000.m4s
   fixed = fixed.replace(
      /(\/bit_transcode\/[^/]+\/128k\/)bit_transcode\/[^/]+\/128k\//gi,
      '$1'
   );

   // Collapse duplicate slashes (except after scheme)
   fixed = fixed.replace(/([^:]\/)\/+/g, '$1');

   return fixed;
}

/**
 * Rewrite full M3U8 text so ExoPlayer receives valid absolute segment URLs.
 */
export function normalizeM3u8Content(content: string): string {
   return content
      .split('\n')
      .map((line) => {
         const trimmed = line.trim();
         if (!trimmed) {
            return line;
         }

         if (trimmed.startsWith('#')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
               return `URI="${normalizeMediaUri(uri)}"`;
            });
         }

         return normalizeMediaUri(trimmed);
      })
      .join('\n');
}
