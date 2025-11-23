/**
 * Streaming Redux slice
 * Manages streaming playlist state including master and detailed playlists with segments
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StreamingPlaylistData } from '@/hooks/useStreamingPlaylist';

/**
 * Streaming state interface
 */
export interface StreamingState {
   playlistsByChapterId: Record<string, StreamingPlaylistData>;
   currentChapterId: string | null;
}

/**
 * Initial streaming state
 */
const initialState: StreamingState = {
   playlistsByChapterId: {},
   currentChapterId: null,
};

/**
 * Streaming slice with reducers and actions
 */
const streamingSlice = createSlice({
   name: 'streaming',
   initialState,
   reducers: {
      /**
       * Store playlist data for a chapter
       * Includes master playlist, selected bitrate, and detailed playlist with segments
       */
      setPlaylist: (
         state,
         action: PayloadAction<{ chapterId: string; playlistData: StreamingPlaylistData }>
      ) => {
         state.playlistsByChapterId[action.payload.chapterId] = action.payload.playlistData;
      },
      /**
       * Clear playlist data for a specific chapter
       */
      clearPlaylist: (state, action: PayloadAction<string>) => {
         delete state.playlistsByChapterId[action.payload];
         // Clear current chapter if it's the one being cleared
         if (state.currentChapterId === action.payload) {
            state.currentChapterId = null;
         }
      },
      /**
       * Clear all playlist data
       */
      clearAllPlaylists: (state) => {
         state.playlistsByChapterId = {};
         state.currentChapterId = null;
      },
      /**
       * Set current active chapter
       */
      setCurrentChapter: (state, action: PayloadAction<string | null>) => {
         state.currentChapterId = action.payload;
      },
   },
});

export const { setPlaylist, clearPlaylist, clearAllPlaylists, setCurrentChapter } =
   streamingSlice.actions;
export default streamingSlice.reducer;

