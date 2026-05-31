import settingsReducer, {
   setColorScheme,
   setPlaybackSpeed,
   setSkipDurationSeconds,
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
});
