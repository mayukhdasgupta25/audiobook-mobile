/**
 * Audiobooks Redux slice
 * Manages audiobooks state organized by tags
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Audiobook, PaginationInfo } from '@/services/audiobooks';

/**
 * Audiobooks state interface
 */
export interface AudiobooksState {
   audiobooksByTag: Record<string, Audiobook[]>;
   pagination: PaginationInfo | null;
   isLoading: boolean;
   error: string | null;
}

/**
 * Initial audiobooks state
 */
const initialState: AudiobooksState = {
   audiobooksByTag: {},
   pagination: null,
   isLoading: false,
   error: null,
};

/**
 * Organize audiobooks by tag type
 * Groups audiobooks into a record where keys are tag types and values are arrays of audiobooks
 */
function organizeByTags(audiobooks: Audiobook[]): Record<string, Audiobook[]> {
   const organized: Record<string, Audiobook[]> = {};

   audiobooks.forEach((audiobook) => {
      // Each audiobook can have multiple tags
      audiobook.audiobookTags.forEach((tag) => {
         const tagType = tag.type;
         if (!organized[tagType]) {
            organized[tagType] = [];
         }
         // Check if audiobook already exists in this tag to avoid duplicates
         const exists = organized[tagType].some((ab) => ab.id === audiobook.id);
         if (!exists) {
            organized[tagType].push(audiobook);
         }
      });
   });

   return organized;
}

/**
 * Audiobooks slice with reducers and actions
 */
const audiobooksSlice = createSlice({
   name: 'audiobooks',
   initialState,
   reducers: {
      /**
       * Set initial audiobooks organized by tags
       */
      setAudiobooks: (
         state,
         action: PayloadAction<{ audiobooks: Audiobook[]; pagination: PaginationInfo }>
      ) => {
         const organized = organizeByTags(action.payload.audiobooks);
         state.audiobooksByTag = organized;
         state.pagination = action.payload.pagination;
         state.isLoading = false;
         state.error = null;
      },
      /**
       * Append next page of audiobooks to existing tags
       */
      appendAudiobooks: (
         state,
         action: PayloadAction<{ audiobooks: Audiobook[]; pagination: PaginationInfo }>
      ) => {
         const organized = organizeByTags(action.payload.audiobooks);

         // Merge new audiobooks with existing ones by tag
         Object.keys(organized).forEach((tagType) => {
            if (!state.audiobooksByTag[tagType]) {
               state.audiobooksByTag[tagType] = [];
            }
            // Append new audiobooks, avoiding duplicates
            organized[tagType].forEach((newAudiobook) => {
               const exists = state.audiobooksByTag[tagType].some(
                  (ab) => ab.id === newAudiobook.id
               );
               if (!exists) {
                  state.audiobooksByTag[tagType].push(newAudiobook);
               }
            });
         });

         state.pagination = action.payload.pagination;
         state.isLoading = false;
         state.error = null;
      },
      /**
       * Clear audiobooks state
       */
      clearAudiobooks: (state) => {
         state.audiobooksByTag = {};
         state.pagination = null;
         state.isLoading = false;
         state.error = null;
      },
      /**
       * Set loading state
       */
      setLoading: (state, action: PayloadAction<boolean>) => {
         state.isLoading = action.payload;
         if (action.payload) {
            state.error = null;
         }
      },
      /**
       * Set error state
       */
      setError: (state, action: PayloadAction<string | null>) => {
         state.error = action.payload;
         state.isLoading = false;
      },
   },
});

export const { setAudiobooks, appendAudiobooks, clearAudiobooks, setLoading, setError } =
   audiobooksSlice.actions;
export default audiobooksSlice.reducer;

