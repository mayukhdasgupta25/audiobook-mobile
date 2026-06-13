import type { RootState } from '@/store';
import type { SleepTimerOption } from '@/constants/sleepTimer';

export function isSleepTimerActive(state: RootState['settings']): boolean {
   if (state.sleepTimerOption === 'off') {
      return false;
   }
   if (state.sleepTimerOption === 'endOfChapter') {
      return true;
   }
   return state.sleepTimerEndsAt !== null && state.sleepTimerEndsAt > Date.now();
}

export function shouldPauseAtChapterEnd(state: RootState['settings']): boolean {
   return state.sleepTimerOption === 'endOfChapter' && isSleepTimerActive(state);
}

export function isWallClockSleepTimerExpired(
   endsAt: number | null,
   now = Date.now()
): boolean {
   return endsAt !== null && endsAt <= now;
}

export function getActiveSleepTimerOption(
   option: SleepTimerOption,
   endsAt: number | null,
   now = Date.now()
): SleepTimerOption {
   if (option === 'off') {
      return 'off';
   }
   if (option === 'endOfChapter') {
      return 'endOfChapter';
   }
   if (endsAt !== null && endsAt > now) {
      return option;
   }
   return 'off';
}
