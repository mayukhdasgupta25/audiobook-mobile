import {
   computeSleepTimerEndsAt,
   formatSleepTimerRemaining,
   getSleepTimerMinutes,
} from '@/constants/sleepTimer';

describe('sleepTimer constants', () => {
   it('getSleepTimerMinutes returns minutes for numeric options', () => {
      expect(getSleepTimerMinutes('15')).toBe(15);
      expect(getSleepTimerMinutes('off')).toBeNull();
      expect(getSleepTimerMinutes('endOfChapter')).toBeNull();
   });

   it('computeSleepTimerEndsAt adds minutes to now', () => {
      const now = 1_000_000;
      expect(computeSleepTimerEndsAt('30', now)).toBe(now + 30 * 60 * 1000);
      expect(computeSleepTimerEndsAt('off', now)).toBeNull();
   });

   it('formatSleepTimerRemaining formats remaining time', () => {
      const now = 0;
      const endsAt = 125_000;
      expect(formatSleepTimerRemaining(endsAt, now)).toBe('2m 5s');
   });
});
