import {
   formatListeningDurationFromSeconds,
   formatProfileListeningHours,
   sumListeningProgressSeconds,
} from '@/utils/listeningDuration';

describe('listeningDuration utils', () => {
   describe('sumListeningProgressSeconds', () => {
      it('sums valid progress values and ignores invalid entries', () => {
         expect(
            sumListeningProgressSeconds([
               { progress: 3600 },
               { progress: 900 },
               { progress: -1 },
               { progress: NaN },
            ])
         ).toBe(4500);
      });
   });

   describe('formatListeningDurationFromSeconds', () => {
      it('formats zero and sub-hour durations', () => {
         expect(formatListeningDurationFromSeconds(0)).toBe('0h0m');
         expect(formatListeningDurationFromSeconds(14 * 60)).toBe('0h14m');
         expect(formatListeningDurationFromSeconds(45 * 60)).toBe('0h45m');
      });

      it('formats hours with and without remaining minutes', () => {
         expect(formatListeningDurationFromSeconds(2 * 3600)).toBe('2h0m');
         expect(formatListeningDurationFromSeconds(2 * 3600 + 15 * 60)).toBe('2h15m');
      });

      it('formats ~32 hours of listening in seconds', () => {
         const thirtyOneHoursFiftySixMinutesInSeconds = 31 * 3600 + 56 * 60;
         expect(formatListeningDurationFromSeconds(thirtyOneHoursFiftySixMinutesInSeconds)).toBe(
            '31h56m'
         );
      });
   });

   describe('formatProfileListeningHours', () => {
      it('aggregates progress across audiobooks', () => {
         expect(
            formatProfileListeningHours([
               { progress: 3600 },
               { progress: 900 },
            ])
         ).toBe('1h15m');
      });

      it('cumulatively formats multiple items in seconds', () => {
         expect(
            formatProfileListeningHours([
               { progress: 10_800 },
               { progress: 5_400 },
            ])
         ).toBe('4h30m');
      });
   });
});
