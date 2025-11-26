/**
 * TanStack Query hook for fetching M3U8 playlists
 * Fetches master playlist, parses it, selects bitrate, and fetches detailed playlist
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { getMasterPlaylist, getPlaylist } from '@/services/streaming';
import { parseMasterPlaylist, parsePlaylist, findStreamByBitrate, getBitrateInKbps } from '@/utils/m3u8Parser';
import { ApiError } from '@/services/api';
import { RootState } from '@/store';
import { setPlaylist } from '@/store/streaming';
import { PlaylistData, MasterPlaylistData } from '@/utils/m3u8Parser';

/**
 * Combined playlist data including master and detailed playlist info
 */
export interface StreamingPlaylistData {
   masterPlaylist: MasterPlaylistData;
   selectedBitrate: number; // in kbps (e.g., 128)
   playlist: PlaylistData;
}

/**
 * Hook to fetch and parse M3U8 playlists for a chapter
 * Automatically fetches master playlist, selects 128k bitrate (or first available),
 * and fetches the detailed playlist
 * 
 * @param chapterId - Chapter ID
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with parsed playlist data
 */
export function useStreamingPlaylist(
   chapterId: string | null,
   enabled = true
) {
   const dispatch = useDispatch();

   // Get userId from Redux store
   const userId = useSelector((state: RootState) => state.auth.user?.id);
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );

   const queryResult = useQuery({
      queryKey: ['streamingPlaylist', chapterId, userId],
      queryFn: async (): Promise<StreamingPlaylistData> => {
         if (!chapterId || !userId) {
            throw new Error('Chapter ID and User ID are required');
         }

         // Step 1: Fetch master playlist
         const masterPlaylistContent = await getMasterPlaylist(chapterId);
         const masterPlaylist = parseMasterPlaylist(masterPlaylistContent);

         if (masterPlaylist.streams.length === 0) {
            throw new Error('No streams found in master playlist');
         }

         // Step 2: Select bitrate (prefer 128k, fallback to first available)
         let selectedStream = findStreamByBitrate(masterPlaylist.streams, 128);
         if (!selectedStream) {
            // Fallback to first available stream
            selectedStream = masterPlaylist.streams[0];
         }

         const selectedBitrate = getBitrateInKbps(selectedStream.bandwidth);

         // Step 3: Extract bitrate from playlist path (e.g., "128k" from "bit_transcode/chapterId/128k/playlist.m3u8")
         // The API expects just the number (e.g., "128"), not "128k"
         const bitrateMatch = selectedStream.playlistPath.match(/\/(\d+)k\//);
         const bitrate = bitrateMatch ? bitrateMatch[1] : selectedBitrate.toString();

         // Step 4: Fetch detailed playlist
         const playlistContent = await getPlaylist(chapterId, bitrate, userId);
         const playlist = parsePlaylist(playlistContent);

         const playlistData: StreamingPlaylistData = {
            masterPlaylist,
            selectedBitrate,
            playlist,
         };

         return playlistData;
      },
      // Only fetch if chapterId and userId are valid, user is authenticated, and auth is initialized
      enabled:
         enabled &&
         !!chapterId &&
         !!userId &&
         isAuthenticated &&
         isInitialized,
      retry: (failureCount, error) => {
         // Don't retry on 401 (unauthorized) errors
         if (error instanceof ApiError && error.status === 401) {
            return false;
         }
         // Retry up to 2 times for other errors
         return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - same as global config
   });

   // Store playlist data in Redux when successfully fetched
   useEffect(() => {
      if (queryResult.data && chapterId) {
         dispatch(setPlaylist({ chapterId, playlistData: queryResult.data }));
      }
   }, [queryResult.data, chapterId, dispatch]);

   return queryResult;
}

