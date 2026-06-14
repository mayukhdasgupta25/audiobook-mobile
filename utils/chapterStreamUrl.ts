/**
 * Resolve HLS playback URL for a chapter (media playlist with user scope).
 */

import { Platform } from 'react-native';
import { store } from '@/store';
import { getMasterPlaylist, getPlaylist } from '@/services/streaming';
import {
   getBitrateInKbps,
   parseMasterPlaylist,
   parsePlaylist,
   selectStreamWithFallback,
   type StreamInfo,
} from '@/utils/m3u8Parser';
import {
   normalizeM3u8Content,
   resolvePlaybackMediaUri,
} from '@/utils/m3u8Normalize';
import { writePlaybackPlaylistFile } from '@/utils/playlistCacheFile';
import type { StreamingPlaylistData } from '@/hooks/useStreamingPlaylist';

export interface ChapterPlaybackSourceOptions {
   /** Subscription tier target; steps down if variant missing from master playlist. */
   preferredBitrateKbps?: number;
   /** Exact bitrate for playback retry fallback (skips cache when different). */
   forceBitrateKbps?: number;
}

export interface ChapterPlaybackSource {
   /** Android: file:// normalized M3U8. iOS: remote HTTP playlist (AVPlayer requires HTTP HLS). */
   url: string;
   totalDurationSeconds: number;
   playlistData: StreamingPlaylistData;
}

function resolveTargetBitrateKbps(options?: ChapterPlaybackSourceOptions): number {
   if (options?.forceBitrateKbps !== undefined) {
      return options.forceBitrateKbps;
   }
   return options?.preferredBitrateKbps ?? 128;
}

function sumSegmentDuration(playlistData: StreamingPlaylistData): number {
   return playlistData.playlist.segments.reduce((sum, segment) => sum + segment.duration, 0);
}

function bitrateFromStream(selectedStream: StreamInfo): string {
   const selectedBitrate = getBitrateInKbps(selectedStream.bandwidth);
   const bitrateMatch = selectedStream.playlistPath.match(/\/(\d+)k\//);
   return bitrateMatch ? bitrateMatch[1] : selectedBitrate.toString();
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

/**
 * Resolve a master-playlist variant path to an absolute HTTP URL for AVPlayer.
 * iOS must use the public bit_transcode playlist (no auth); the API playlist returns 401 without a token.
 */
export function resolveAbsoluteStreamUrl(pathOrUrl: string): string {
   return resolvePlaybackMediaUri(pathOrUrl);
}

function buildIosPlaybackUrl(selectedStream: StreamInfo): string {
   return resolveAbsoluteStreamUrl(selectedStream.playlistPath);
}

async function buildAndroidPlaybackFileUrl(
   chapterId: string,
   bitrate: string,
   userId: string,
   rawPlaylistContent: string
): Promise<string> {
   const normalized = normalizeM3u8Content(rawPlaylistContent, { chapterId, bitrate });
   return writePlaybackPlaylistFile(chapterId, bitrate, userId, normalized);
}

async function buildPlaybackUrl(
   chapterId: string,
   bitrate: string,
   userId: string,
   rawPlaylistContent: string,
   selectedStream: StreamInfo
): Promise<string> {
   if (Platform.OS === 'ios') {
      return buildIosPlaybackUrl(selectedStream);
   }
   return buildAndroidPlaybackFileUrl(chapterId, bitrate, userId, rawPlaylistContent);
}

function selectedStreamFromCached(cached: StreamingPlaylistData): StreamInfo {
   const match = cached.masterPlaylist.streams.find(
      (s) => getBitrateInKbps(s.bandwidth) === cached.selectedBitrate
   );
   return match ?? cached.masterPlaylist.streams[0];
}

async function buildSourceFromMaster(
   chapterId: string,
   userId: string,
   targetBitrateKbps: number
): Promise<ChapterPlaybackSource> {
   const masterPlaylistContent = await getMasterPlaylist(chapterId);
   const masterPlaylist = parseMasterPlaylist(masterPlaylistContent);

   if (masterPlaylist.streams.length === 0) {
      throw new Error('No streams found in master playlist');
   }

   const selectedStream = selectStreamWithFallback(masterPlaylist.streams, targetBitrateKbps);
   const selectedBitrate = getBitrateInKbps(selectedStream.bandwidth);
   const bitrate = bitrateFromStream(selectedStream);

   const rawPlaylistContent = await getPlaylist(chapterId, bitrate, userId);
   const normalizedPlaylistContent = normalizeM3u8Content(rawPlaylistContent, {
      chapterId,
      bitrate,
   });
   const playlist = parsePlaylist(normalizedPlaylistContent);

   const playlistData: StreamingPlaylistData = {
      masterPlaylist,
      selectedBitrate,
      playlist,
   };

   const url = await buildPlaybackUrl(
      chapterId,
      bitrate,
      userId,
      rawPlaylistContent,
      selectedStream
   );

   return {
      url,
      totalDurationSeconds: sumSegmentDuration(playlistData),
      playlistData,
   };
}

/**
 * Fetch master + media playlist, normalize segment URLs, write local M3U8 for the player.
 */
export async function fetchChapterPlaybackSource(
   chapterId: string,
   userId: string,
   options?: ChapterPlaybackSourceOptions
): Promise<ChapterPlaybackSource> {
   return buildSourceFromMaster(chapterId, userId, resolveTargetBitrateKbps(options));
}

/**
 * Use cached Redux playlist metadata when bitrate matches; otherwise refetch at requested bitrate.
 */
export async function resolveChapterPlaybackSource(
   chapterId: string,
   userId: string,
   options?: ChapterPlaybackSourceOptions
): Promise<ChapterPlaybackSource> {
   const targetBitrateKbps = resolveTargetBitrateKbps(options);
   const cached = store.getState().streaming.playlistsByChapterId[chapterId];

   if (cached && cached.selectedBitrate === targetBitrateKbps) {
      const bitrate = bitrateFromPlaylistData(cached);
      const rawPlaylistContent = await getPlaylist(chapterId, bitrate, userId);
      const stream = selectedStreamFromCached(cached);
      const url = await buildPlaybackUrl(
         chapterId,
         bitrate,
         userId,
         rawPlaylistContent,
         stream
      );

      return {
         url,
         totalDurationSeconds: sumSegmentDuration(cached),
         playlistData: cached,
      };
   }

   return fetchChapterPlaybackSource(chapterId, userId, options);
}
