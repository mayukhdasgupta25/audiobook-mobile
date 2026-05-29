export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'evening';

/**
 * Morning: 5:00–11:59, afternoon: 12:00–16:59, evening: 17:00–4:59
 */
export function getTimeOfDayPeriod(date: Date = new Date()): TimeOfDayPeriod {
   const hour = date.getHours();

   if (hour >= 5 && hour < 12) {
      return 'morning';
   }
   if (hour >= 12 && hour < 17) {
      return 'afternoon';
   }
   return 'evening';
}

export function getTimeOfDayGreeting(period: TimeOfDayPeriod): string {
   switch (period) {
      case 'morning':
         return 'Good morning';
      case 'afternoon':
         return 'Good afternoon';
      case 'evening':
         return 'Good evening';
   }
}

export function getTimeOfDaySubtitle(period: TimeOfDayPeriod): string {
   switch (period) {
      case 'morning':
         return 'What would you like to listen to today?';
      case 'afternoon':
         return 'Perfect time for an audiobook break.';
      case 'evening':
         return 'Wind down with a great story tonight.';
   }
}
