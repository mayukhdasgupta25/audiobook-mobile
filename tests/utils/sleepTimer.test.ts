import {
   isSleepTimerActive,
   shouldPauseAtChapterEnd,
   isWallClockSleepTimerExpired,
} from '@/utils/sleepTimer';
import type { SettingsState } from '@/store/settings';

function makeSettings(overrides: Partial<SettingsState>): SettingsState {
   return {
      skipDurationSeconds: 10,
      playbackSpeed: 1,
      colorScheme: 'light',
      sleepTimerOption: 'off',
      sleepTimerEndsAt: null,
      ...overrides,
   };
}

describe('sleepTimer utils', () => {
   it('isSleepTimerActive returns false when off', () => {
      expect(isSleepTimerActive(makeSettings({ sleepTimerOption: 'off' }))).toBe(false);
   });

   it('isSleepTimerActive returns true for endOfChapter', () => {
      expect(
         isSleepTimerActive(makeSettings({ sleepTimerOption: 'endOfChapter' }))
      ).toBe(true);
   });

   it('isSleepTimerActive returns true when endsAt is in the future', () => {
      expect(
         isSleepTimerActive(
            makeSettings({
               sleepTimerOption: '30',
               sleepTimerEndsAt: Date.now() + 60_000,
            })
         )
      ).toBe(true);
   });

   it('isSleepTimerActive returns false when endsAt has passed', () => {
      expect(
         isSleepTimerActive(
            makeSettings({
               sleepTimerOption: '30',
               sleepTimerEndsAt: Date.now() - 1000,
            })
         )
      ).toBe(false);
   });

   it('shouldPauseAtChapterEnd is true only for endOfChapter mode', () => {
      expect(
         shouldPauseAtChapterEnd(makeSettings({ sleepTimerOption: 'endOfChapter' }))
      ).toBe(true);
      expect(
         shouldPauseAtChapterEnd(
            makeSettings({ sleepTimerOption: '30', sleepTimerEndsAt: Date.now() + 60_000 })
         )
      ).toBe(false);
   });

   it('isWallClockSleepTimerExpired detects past endsAt', () => {
      expect(isWallClockSleepTimerExpired(Date.now() - 1)).toBe(true);
      expect(isWallClockSleepTimerExpired(Date.now() + 60_000)).toBe(false);
      expect(isWallClockSleepTimerExpired(null)).toBe(false);
   });
});
