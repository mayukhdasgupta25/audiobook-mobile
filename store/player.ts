/**
 * Audio Player Redux slice
 * Manages audio playback state including current chapter, segment, and playback position
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Chapter metadata for player UI
 */
export interface ChapterMetadata {
   id: string;
   title: string;
   coverImage: string | null;
}

/**
 * Player state interface
 */
export interface PlayerState {
   isPlaying: boolean;
   currentChapterId: string | null;
   currentSegmentIndex: number;
   playbackPosition: number; // Current position in seconds within current segment
   totalDuration: number; // Total duration of all segments combined in seconds
   isLoading: boolean;
   error: string | null;
   isVisible: boolean; // Whether player UI is visible
   isMinimized: boolean; // Whether player is in minimized state
   chapterMetadata: ChapterMetadata | null; // Chapter title and cover for UI
}

/**
 * Initial player state
 */
const initialState: PlayerState = {
   isPlaying: false,
   currentChapterId: null,
   currentSegmentIndex: 0,
   playbackPosition: 0,
   totalDuration: 0,
   isLoading: false,
   error: null,
   isVisible: false,
   isMinimized: false,
   chapterMetadata: null,
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
         action: PayloadAction<{ chapterId: string; metadata: ChapterMetadata }>
      ) => {
         state.currentChapterId = action.payload.chapterId;
         state.currentSegmentIndex = 0;
         state.playbackPosition = 0;
         state.isVisible = true;
         state.error = null;
         state.chapterMetadata = action.payload.metadata;
      },
      /**
       * Start or resume playback
       */
      play: (state) => {
         state.isPlaying = true;
         state.error = null;
      },
      /**
       * Pause playback
       */
      pause: (state) => {
         state.isPlaying = false;
      },
      /**
       * Stop playback and reset
       */
      stop: (state) => {
         state.isPlaying = false;
         state.currentSegmentIndex = 0;
         state.playbackPosition = 0;
         state.error = null;
      },
      /**
       * Set current segment index
       */
      setSegmentIndex: (state, action: PayloadAction<number>) => {
         state.currentSegmentIndex = action.payload;
         state.playbackPosition = 0; // Reset position when segment changes
      },
      /**
       * Update playback position
       */
      setPosition: (state, action: PayloadAction<number>) => {
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
         state.totalDuration = action.payload;
      },
      /**
       * Set loading state
       */
      setLoading: (state, action: PayloadAction<boolean>) => {
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
         // Reset minimized state when hiding player
         if (!action.payload) {
            state.isMinimized = false;
         }
      },
      /**
       * Set minimized state
       */
      setMinimized: (state, action: PayloadAction<boolean>) => {
         state.isMinimized = action.payload;
      },
   },
});

export const {
   setChapter,
   play,
   pause,
   stop,
   setSegmentIndex,
   setPosition,
   seek,
   setTotalDuration,
   setLoading,
   setError,
   setVisible,
   setMinimized,
} = playerSlice.actions;
export default playerSlice.reducer;

