/**
 * TanStack Query hook for fetching M3U8 playlists
 * Fetches master playlist, parses it, selects bitrate, and fetches detailed playlist
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { queryKeys } from '@/constants/queryKeys';
import { RootState } from '@/store';
import { shouldRetryQuery } from '@/utils/queryRetry';
import { useResourceDeleted } from '@/hooks/useResourceDeleted';
import { setPlaylist } from '@/store/streaming';
import { PlaylistData, MasterPlaylistData } from '@/utils/m3u8Parser';
import { fetchChapterPlaybackSource } from '@/utils/chapterStreamUrl';
import { usePreferredPlaybackBitrate } from '@/hooks/usePreferredPlaybackBitrate';

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
 * Automatically fetches master playlist, selects bitrate from subscription tier (with fallback),
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

   const isChapterDeleted = useResourceDeleted('chapters', chapterId ?? '');
   const preferredBitrateKbps = usePreferredPlaybackBitrate();

   const queryResult = useQuery({
      queryKey: queryKeys.streaming.playlist(
         chapterId ?? '',
         userId ?? '',
         preferredBitrateKbps
      ),
      queryFn: async (): Promise<StreamingPlaylistData> => {
         if (!chapterId || !userId) {
            throw new Error('Chapter ID and User ID are required');
         }

         const source = await fetchChapterPlaybackSource(chapterId, userId, {
            preferredBitrateKbps,
         });
         return source.playlistData;
      },
      // Only fetch if chapterId and userId are valid, user is authenticated, and auth is initialized
      enabled:
         enabled &&
         !!chapterId &&
         !!userId &&
         isAuthenticated &&
         isInitialized &&
         !isChapterDeleted,
      retry: shouldRetryQuery,
      meta: { silent404: true },
   });

   // Store playlist data in Redux when successfully fetched
   useEffect(() => {
      if (queryResult.data && chapterId) {
         dispatch(setPlaylist({ chapterId, playlistData: queryResult.data }));
      }
   }, [queryResult.data, chapterId, dispatch]);

   return queryResult;
}

