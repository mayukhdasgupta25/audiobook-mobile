/**
 * Fix server-generated M3U8 quirks (backslashes, duplicated path segments) before native playback.
 * Rewrites segment/init URIs to the client-configured streaming base so devices can reach them.
 */

import { STREAMING_API_BASE_URL } from '@/services/api';

export interface M3u8NormalizeContext {
   chapterId?: string;
   bitrate?: string;
}

function isDevRewriteHost(hostname: string): boolean {
   const host = hostname.toLowerCase();
   return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '10.0.2.2' ||
      /^192\.168\./.test(host)
   );
}

/** Keep external/CDN URLs intact; only rewrite dev-server hosts to the client streaming base. */
function shouldPreserveAbsolutePlaybackUri(uri: string): boolean {
   try {
      const parsed = new URL(uri);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('amazonaws.com') || host.includes('cloudfront.net')) {
         return true;
      }

      if (parsed.search.includes('X-Amz-')) {
         return true;
      }

      return !isDevRewriteHost(host);
   } catch {
      return false;
   }
}

/**
 * Normalize a single media URI from the playlist (segment, init map, etc.).
 * Fixes path quirks only; does not rewrite hosts.
 */
export function normalizeMediaUri(uri: string): string {
   let fixed = uri.replace(/\\/g, '/');

   // e.g. .../128k/bit_transcode/{id}/128k/segment_000.m4s -> .../128k/segment_000.m4s
   fixed = fixed.replace(
      /(\/bit_transcode\/[^/]+\/\d+k\/)bit_transcode\/[^/]+\/\d+k\//gi,
      '$1'
   );

   // Collapse duplicate slashes (except after scheme)
   fixed = fixed.replace(/([^:]\/)\/+/g, '$1');

   return fixed;
}

/**
 * Resolve a playlist media URI to an absolute URL reachable from this device.
 */
export function resolvePlaybackMediaUri(
   uri: string,
   context?: M3u8NormalizeContext
): string {
   const fixed = normalizeMediaUri(uri);
   const base = STREAMING_API_BASE_URL.replace(/\/$/, '');

   if (/^https?:\/\//i.test(fixed)) {
      if (shouldPreserveAbsolutePlaybackUri(fixed)) {
         return fixed;
      }

      try {
         const parsed = new URL(fixed);
         return `${base}${parsed.pathname}${parsed.search}`;
      } catch {
         return fixed;
      }
   }

   const path = fixed.replace(/^\//, '');

   if (
      context?.chapterId &&
      context?.bitrate &&
      (path === 'init.mp4' || path.endsWith('.m4s') || path.endsWith('.ts'))
   ) {
      return `${base}/bit_transcode/${context.chapterId}/${context.bitrate}k/${path}`;
   }

   return `${base}/${path}`;
}

/**
 * Rewrite full M3U8 text so ExoPlayer receives valid absolute segment URLs.
 */
export function normalizeM3u8Content(
   content: string,
   context?: M3u8NormalizeContext
): string {
   return content
      .split('\n')
      .map((line) => {
         const trimmed = line.trim();
         if (!trimmed) {
            return line;
         }

         if (trimmed.startsWith('#')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
               return `URI="${resolvePlaybackMediaUri(uri, context)}"`;
            });
         }

         if (
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('bit_transcode/') ||
            trimmed.startsWith('/bit_transcode/') ||
            trimmed.endsWith('.m4s') ||
            trimmed.endsWith('.ts') ||
            trimmed === 'init.mp4'
         ) {
            return resolvePlaybackMediaUri(trimmed, context);
         }

         return trimmed;
      })
      .join('\n');
}
