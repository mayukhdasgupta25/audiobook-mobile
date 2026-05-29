import {
   getTimeOfDayGreeting,
   getTimeOfDayPeriod,
   getTimeOfDaySubtitle,
} from '@/utils/timeOfDay';

function dateAtHour(hour: number): Date {
   const date = new Date('2026-05-29T00:00:00');
   date.setHours(hour, 30, 0, 0);
   return date;
}

describe('timeOfDay', () => {
   it('returns morning between 5:00 and 11:59', () => {
      expect(getTimeOfDayPeriod(dateAtHour(5))).toBe('morning');
      expect(getTimeOfDayPeriod(dateAtHour(11))).toBe('morning');
   });

   it('returns afternoon between 12:00 and 16:59', () => {
      expect(getTimeOfDayPeriod(dateAtHour(12))).toBe('afternoon');
      expect(getTimeOfDayPeriod(dateAtHour(16))).toBe('afternoon');
   });

   it('returns evening before 5:00 and from 17:00 onward', () => {
      expect(getTimeOfDayPeriod(dateAtHour(4))).toBe('evening');
      expect(getTimeOfDayPeriod(dateAtHour(17))).toBe('evening');
      expect(getTimeOfDayPeriod(dateAtHour(23))).toBe('evening');
   });

   it('maps each period to a greeting and subtitle', () => {
      expect(getTimeOfDayGreeting('morning')).toBe('Good morning');
      expect(getTimeOfDayGreeting('afternoon')).toBe('Good afternoon');
      expect(getTimeOfDayGreeting('evening')).toBe('Good evening');

      expect(getTimeOfDaySubtitle('morning')).toContain('listen');
      expect(getTimeOfDaySubtitle('afternoon')).toContain('audiobook');
      expect(getTimeOfDaySubtitle('evening')).toContain('story');
   });
});
