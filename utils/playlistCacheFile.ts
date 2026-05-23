/**
 * Write a normalized M3U8 playlist to the app cache for native HLS playback.
 */

import * as FileSystem from 'expo-file-system/legacy';

function cacheFileUri(chapterId: string, bitrate: string, userId: string): string {
   const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, '_');
   return `${FileSystem.cacheDirectory}playback-${chapterId}-${bitrate}-${safeUser}.m3u8`;
}

/**
 * Persist playlist text and return a file:// URI for react-native-track-player.
 */
export async function writePlaybackPlaylistFile(
   chapterId: string,
   bitrate: string,
   userId: string,
   m3u8Content: string
): Promise<string> {
   const uri = cacheFileUri(chapterId, bitrate, userId);
   await FileSystem.writeAsStringAsync(uri, m3u8Content, {
      encoding: FileSystem.EncodingType.UTF8,
   });
   return uri;
}

export async function deletePlaybackPlaylistFile(
   chapterId: string,
   bitrate: string,
   userId: string
): Promise<void> {
   const uri = cacheFileUri(chapterId, bitrate, userId);
   try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
   } catch {
      // Cache file may not exist
   }
}
