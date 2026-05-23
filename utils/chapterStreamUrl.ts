/**
 * Resolve HLS playback URL for a chapter (media playlist with user scope).
 */

import { store } from '@/store';
import { getMasterPlaylist, getPlaylist } from '@/services/streaming';
import {
   findStreamByBitrate,
   getBitrateInKbps,
   parseMasterPlaylist,
   parsePlaylist,
} from '@/utils/m3u8Parser';
import { normalizeM3u8Content } from '@/utils/m3u8Normalize';
import { writePlaybackPlaylistFile } from '@/utils/playlistCacheFile';
import type { StreamingPlaylistData } from '@/hooks/useStreamingPlaylist';

export interface ChapterPlaybackSource {
   /** file:// URI to a normalized local M3U8 for native playback */
   url: string;
   totalDurationSeconds: number;
   playlistData: StreamingPlaylistData;
}

function sumSegmentDuration(playlistData: StreamingPlaylistData): number {
   return playlistData.playlist.segments.reduce((sum, segment) => sum + segment.duration, 0);
}

function bitrateFromPlaylistData(playlistData: StreamingPlaylistData): string {
   const stream = playlistData.masterPlaylist.streams.find(
      (s) => getBitrateInKbps(s.bandwidth) === playlistData.selectedBitrate
   );
   const match = stream?.playlistPath.match(/\/(\d+)k\//);
   if (match) {
      return match[1];
   }
   return playlistData.selectedBitrate.toString();
}

async function buildPlaybackFileUrl(
   chapterId: string,
   bitrate: string,
   userId: string,
   rawPlaylistContent: string
): Promise<string> {
   const normalized = normalizeM3u8Content(rawPlaylistContent);
   return writePlaybackPlaylistFile(chapterId, bitrate, userId, normalized);
}

/**
 * Fetch master + media playlist, normalize segment URLs, write local M3U8 for the player.
 */
export async function fetchChapterPlaybackSource(
   chapterId: string,
   userId: string
): Promise<ChapterPlaybackSource> {
   const masterPlaylistContent = await getMasterPlaylist(chapterId);
   const masterPlaylist = parseMasterPlaylist(masterPlaylistContent);

   if (masterPlaylist.streams.length === 0) {
      throw new Error('No streams found in master playlist');
   }

   let selectedStream = findStreamByBitrate(masterPlaylist.streams, 128);
   if (!selectedStream) {
      selectedStream = masterPlaylist.streams[0];
   }

   const selectedBitrate = getBitrateInKbps(selectedStream.bandwidth);
   const bitrateMatch = selectedStream.playlistPath.match(/\/(\d+)k\//);
   const bitrate = bitrateMatch ? bitrateMatch[1] : selectedBitrate.toString();

   const rawPlaylistContent = await getPlaylist(chapterId, bitrate, userId);
   const normalizedPlaylistContent = normalizeM3u8Content(rawPlaylistContent);
   const playlist = parsePlaylist(normalizedPlaylistContent);

   const playlistData: StreamingPlaylistData = {
      masterPlaylist,
      selectedBitrate,
      playlist,
   };

   const url = await buildPlaybackFileUrl(
      chapterId,
      bitrate,
      userId,
      rawPlaylistContent
   );

   return {
      url,
      totalDurationSeconds: sumSegmentDuration(playlistData),
      playlistData,
   };
}

/**
 * Use cached Redux playlist metadata when available; always refresh normalized local M3U8.
 */
export async function resolveChapterPlaybackSource(
   chapterId: string,
   userId: string
): Promise<ChapterPlaybackSource> {
   const cached = store.getState().streaming.playlistsByChapterId[chapterId];

   if (cached) {
      const bitrate = bitrateFromPlaylistData(cached);
      const rawPlaylistContent = await getPlaylist(chapterId, bitrate, userId);
      const url = await buildPlaybackFileUrl(
         chapterId,
         bitrate,
         userId,
         rawPlaylistContent
      );

      return {
         url,
         totalDurationSeconds: sumSegmentDuration(cached),
         playlistData: cached,
      };
   }

   return fetchChapterPlaybackSource(chapterId, userId);
}
