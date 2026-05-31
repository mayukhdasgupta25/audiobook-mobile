/**
 * User playback preferences (persisted via redux-persist).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
   DEFAULT_PLAYBACK_SPEED,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';
import type { ColorScheme } from '@/theme';

export type SkipDurationSeconds = 5 | 10 | 15;

export interface SettingsState {
   skipDurationSeconds: SkipDurationSeconds;
   playbackSpeed: PlaybackSpeed;
   colorScheme: ColorScheme;
}

const initialState: SettingsState = {
   skipDurationSeconds: 10,
   playbackSpeed: DEFAULT_PLAYBACK_SPEED,
   colorScheme: 'light',
};

const settingsSlice = createSlice({
   name: 'settings',
   initialState,
   reducers: {
      setSkipDurationSeconds: (state, action: PayloadAction<SkipDurationSeconds>) => {
         state.skipDurationSeconds = action.payload;
      },
      setPlaybackSpeed: (state, action: PayloadAction<PlaybackSpeed>) => {
         state.playbackSpeed = action.payload;
      },
      setColorScheme: (state, action: PayloadAction<ColorScheme>) => {
         state.colorScheme = action.payload;
      },
   },
});

export const { setSkipDurationSeconds, setPlaybackSpeed, setColorScheme } =
   settingsSlice.actions;
export default settingsSlice.reducer;
