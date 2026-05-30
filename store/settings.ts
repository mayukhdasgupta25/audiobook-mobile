/**
 * User playback preferences (persisted via redux-persist).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
   DEFAULT_PLAYBACK_SPEED,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';

export type SkipDurationSeconds = 5 | 10 | 15;

export interface SettingsState {
   skipDurationSeconds: SkipDurationSeconds;
   playbackSpeed: PlaybackSpeed;
}

const initialState: SettingsState = {
   skipDurationSeconds: 10,
   playbackSpeed: DEFAULT_PLAYBACK_SPEED,
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
   },
});

export const { setSkipDurationSeconds, setPlaybackSpeed } = settingsSlice.actions;
export default settingsSlice.reducer;
