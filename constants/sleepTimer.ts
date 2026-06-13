/** Sleep timer duration options (minutes) or end-of-chapter mode */
export const SLEEP_TIMER_OPTIONS = [
   'off',
   '15',
   '30',
   '45',
   '60',
   'endOfChapter',
] as const;

export type SleepTimerOption = (typeof SLEEP_TIMER_OPTIONS)[number];

export const DEFAULT_SLEEP_TIMER_OPTION: SleepTimerOption = 'off';

export interface SleepTimerChoice {
   value: SleepTimerOption;
   label: string;
}

export const SLEEP_TIMER_CHOICES: readonly SleepTimerChoice[] = [
   { value: 'off', label: 'Off' },
   { value: '15', label: '15 min' },
   { value: '30', label: '30 min' },
   { value: '45', label: '45 min' },
   { value: '60', label: '1 hour' },
   { value: 'endOfChapter', label: 'End of chapter' },
] as const;

export function getSleepTimerMinutes(option: SleepTimerOption): number | null {
   if (option === 'off' || option === 'endOfChapter') {
      return null;
   }
   return Number.parseInt(option, 10);
}

export function formatSleepTimerLabel(option: SleepTimerOption): string {
   const choice = SLEEP_TIMER_CHOICES.find((c) => c.value === option);
   return choice?.label ?? 'Off';
}

export function formatSleepTimerRemaining(endsAt: number | null, now = Date.now()): string {
   if (endsAt === null) {
      return 'Off';
   }
   const remainingMs = Math.max(0, endsAt - now);
   if (remainingMs <= 0) {
      return 'Off';
   }
   const totalSeconds = Math.ceil(remainingMs / 1000);
   const minutes = Math.floor(totalSeconds / 60);
   const seconds = totalSeconds % 60;
   if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
   }
   if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
   }
   return `${seconds}s`;
}

export function computeSleepTimerEndsAt(option: SleepTimerOption, now = Date.now()): number | null {
   const minutes = getSleepTimerMinutes(option);
   if (minutes === null) {
      return null;
   }
   return now + minutes * 60 * 1000;
}
