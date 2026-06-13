/**
 * User playback preferences (persisted via redux-persist).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
   DEFAULT_PLAYBACK_SPEED,
   type PlaybackSpeed,
} from '@/constants/playbackSpeed';
import {
   DEFAULT_SLEEP_TIMER_OPTION,
   computeSleepTimerEndsAt,
   type SleepTimerOption,
} from '@/constants/sleepTimer';
import type { ColorScheme } from '@/theme';

export type SkipDurationSeconds = 5 | 10 | 15;

export interface SettingsState {
   skipDurationSeconds: SkipDurationSeconds;
   playbackSpeed: PlaybackSpeed;
   colorScheme: ColorScheme;
   sleepTimerOption: SleepTimerOption;
   sleepTimerEndsAt: number | null;
}

const initialState: SettingsState = {
   skipDurationSeconds: 10,
   playbackSpeed: DEFAULT_PLAYBACK_SPEED,
   colorScheme: 'light',
   sleepTimerOption: DEFAULT_SLEEP_TIMER_OPTION,
   sleepTimerEndsAt: null,
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
      setSleepTimerOption: (state, action: PayloadAction<SleepTimerOption>) => {
         state.sleepTimerOption = action.payload;
      },
      startSleepTimer: (state, action: PayloadAction<SleepTimerOption>) => {
         const option = action.payload;
         state.sleepTimerOption = option;
         if (option === 'off') {
            state.sleepTimerEndsAt = null;
            return;
         }
         if (option === 'endOfChapter') {
            state.sleepTimerEndsAt = null;
            return;
         }
         state.sleepTimerEndsAt = computeSleepTimerEndsAt(option);
      },
      clearSleepTimer: (state) => {
         state.sleepTimerOption = DEFAULT_SLEEP_TIMER_OPTION;
         state.sleepTimerEndsAt = null;
      },
   },
});

export const {
   setSkipDurationSeconds,
   setPlaybackSpeed,
   setColorScheme,
   setSleepTimerOption,
   startSleepTimer,
   clearSleepTimer,
} = settingsSlice.actions;
export default settingsSlice.reducer;
