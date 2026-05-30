/**
 * Audio Player Redux slice
 * Manages audio playback state including current chapter and playback position
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Chapter metadata for player UI
 */
export interface ChapterMetadata {
   id: string;
   title: string;
   coverImage: string | null;
   maximizedChapterCoverImage: string | null;
   minimizedChapterCoverImage: string | null;
   chapterNumber?: number;
   totalChapters?: number;
   audiobookTitle?: string;
}

/**
 * Player state interface
 */
export interface PlayerState {
   isPlaying: boolean;
   currentChapterId: string | null;
   playbackPosition: number; // Current position in seconds from start of chapter
   totalDuration: number; // Total duration of chapter in seconds
   isLoading: boolean;
   error: string | null;
   isVisible: boolean; // Whether player UI is visible
   isMinimized: boolean; // Whether player is in minimized state
   /** Hide player chrome while playback continues (e.g. comments screen) */
   isUiSuppressed: boolean;
   chapterMetadata: ChapterMetadata | null; // Chapter title and cover for UI
   audiobookId: string | null; // Audiobook ID for fetching next chapter
   /** Last in-app route while a chapter was loaded (for notification resume). */
   playbackReturnPath: string | null;
}

/**
 * Initial player state
 */
const initialState: PlayerState = {
   isPlaying: false,
   currentChapterId: null,
   playbackPosition: 0,
   totalDuration: 0,
   isLoading: false,
   error: null,
   isVisible: false,
   isMinimized: false,
   isUiSuppressed: false,
   chapterMetadata: null,
   audiobookId: null,
   playbackReturnPath: null,
};

/**
 * Player slice with reducers and actions
 */
const playerSlice = createSlice({
   name: 'player',
   initialState,
   reducers: {
      /**
       * Set current chapter to play
       */
      setChapter: (
         state,
         action: PayloadAction<{
            chapterId: string;
            metadata: ChapterMetadata;
            audiobookId?: string;
            resumePosition?: number;
         }>
      ) => {
         state.currentChapterId = action.payload.chapterId;
         state.playbackPosition = Math.max(0, action.payload.resumePosition ?? 0);
         state.isVisible = true;
         state.error = null;
         state.chapterMetadata = action.payload.metadata;
         if (action.payload.audiobookId) {
            state.audiobookId = action.payload.audiobookId;
         }
      },
      /**
       * Start or resume playback. Re-opens player when a chapter is already loaded.
       */
      play: (state) => {
         state.isPlaying = true;
         state.error = null;
         if (state.currentChapterId) {
            state.isVisible = true;
            state.isMinimized = false;
            state.isUiSuppressed = false;
         }
      },
      /**
       * Pause playback
       */
      pause: (state) => {
         state.isPlaying = false;
      },
      /**
       * Stop playback and reset position (keeps loaded chapter for resume)
       */
      stop: (state) => {
         state.isPlaying = false;
         state.playbackPosition = 0;
         state.error = null;
         state.isLoading = false;
      },
      /**
       * Clears loaded chapter and UI state (close player, logout)
       */
      releasePlayback: () => initialState,
      /**
       * Update playback position
       */
      setPosition: (state, action: PayloadAction<number>) => {
         if (Math.abs(state.playbackPosition - action.payload) < 0.25) {
            return;
         }
         state.playbackPosition = action.payload;
      },
      /**
       * Seek forward or backward by specified seconds
       */
      seek: (state) => {
         // Seek is handled in the hook, this just clears any errors
         state.error = null;
      },
      /**
       * Set total duration
       */
      setTotalDuration: (state, action: PayloadAction<number>) => {
         if (action.payload <= 0) {
            return;
         }
         if (Math.abs(state.totalDuration - action.payload) < 0.5) {
            return;
         }
         state.totalDuration = action.payload;
      },
      /**
       * Set loading state
       */
      setLoading: (state, action: PayloadAction<boolean>) => {
         if (state.isLoading === action.payload) {
            return;
         }
         state.isLoading = action.payload;
      },
      /**
       * Set error state
       */
      setError: (state, action: PayloadAction<string | null>) => {
         state.error = action.payload;
         if (action.payload) {
            state.isLoading = false;
         }
      },
      /**
       * Show/hide player UI
       */
      setVisible: (state, action: PayloadAction<boolean>) => {
         state.isVisible = action.payload;
         if (!action.payload) {
            state.isMinimized = false;
            state.isPlaying = false;
            state.isLoading = false;
         }
      },
      /**
       * Set minimized state
       */
      setMinimized: (state, action: PayloadAction<boolean>) => {
         state.isMinimized = action.payload;
      },
      /** Hide player UI without pausing playback */
      setUiSuppressed: (state, action: PayloadAction<boolean>) => {
         state.isUiSuppressed = action.payload;
      },
      setPlaybackReturnPath: (state, action: PayloadAction<string | null>) => {
         state.playbackReturnPath = action.payload;
      },
   },
});

export const {
   setChapter,
   play,
   pause,
   stop,
   releasePlayback,
   setPosition,
   seek,
   setTotalDuration,
   setLoading,
   setError,
   setVisible,
   setMinimized,
   setUiSuppressed,
   setPlaybackReturnPath,
} = playerSlice.actions;
export default playerSlice.reducer;

