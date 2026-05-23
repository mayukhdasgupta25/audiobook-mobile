/**
 * User playback preferences (persisted via redux-persist).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SkipDurationSeconds = 5 | 10 | 15;

export interface SettingsState {
   skipDurationSeconds: SkipDurationSeconds;
}

const initialState: SettingsState = {
   skipDurationSeconds: 10,
};

const settingsSlice = createSlice({
   name: 'settings',
   initialState,
   reducers: {
      setSkipDurationSeconds: (state, action: PayloadAction<SkipDurationSeconds>) => {
         state.skipDurationSeconds = action.payload;
      },
   },
});

export const { setSkipDurationSeconds } = settingsSlice.actions;
export default settingsSlice.reducer;
