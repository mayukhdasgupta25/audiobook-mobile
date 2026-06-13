import settingsReducer, {
   setColorScheme,
   setPlaybackSpeed,
   setSkipDurationSeconds,
   startSleepTimer,
   clearSleepTimer,
} from '@/store/settings';

describe('settings reducer', () => {
   it('defaults colorScheme to light', () => {
      const state = settingsReducer(undefined, { type: '@@INIT' });
      expect(state.colorScheme).toBe('light');
   });

   it('setColorScheme updates theme preference', () => {
      const state = settingsReducer(undefined, setColorScheme('dark'));
      expect(state.colorScheme).toBe('dark');
   });

   it('preserves other settings when colorScheme changes', () => {
      let state = settingsReducer(undefined, setSkipDurationSeconds(15));
      state = settingsReducer(state, setPlaybackSpeed(1.5));
      state = settingsReducer(state, setColorScheme('dark'));

      expect(state.skipDurationSeconds).toBe(15);
      expect(state.playbackSpeed).toBe(1.5);
      expect(state.colorScheme).toBe('dark');
   });

   it('startSleepTimer sets endsAt for wall-clock options', () => {
      const before = Date.now();
      const state = settingsReducer(undefined, startSleepTimer('15'));
      expect(state.sleepTimerOption).toBe('15');
      expect(state.sleepTimerEndsAt).not.toBeNull();
      expect(state.sleepTimerEndsAt).toBeGreaterThanOrEqual(before + 14 * 60 * 1000);
   });

   it('startSleepTimer clears endsAt for endOfChapter', () => {
      const state = settingsReducer(undefined, startSleepTimer('endOfChapter'));
      expect(state.sleepTimerOption).toBe('endOfChapter');
      expect(state.sleepTimerEndsAt).toBeNull();
   });

   it('clearSleepTimer resets timer state', () => {
      let state = settingsReducer(undefined, startSleepTimer('30'));
      state = settingsReducer(state, clearSleepTimer());
      expect(state.sleepTimerOption).toBe('off');
      expect(state.sleepTimerEndsAt).toBeNull();
   });
});
