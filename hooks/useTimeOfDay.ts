import { useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
   getTimeOfDayGreeting,
   getTimeOfDayPeriod,
   getTimeOfDaySubtitle,
   type TimeOfDayPeriod,
} from '@/utils/timeOfDay';

const REFRESH_INTERVAL_MS = 60_000;

export interface TimeOfDayState {
   period: TimeOfDayPeriod;
   greeting: string;
   subtitle: string;
   /** Local hour (0–23) from the device clock */
   hour: number;
}

/**
 * Reads the device clock and keeps morning / afternoon / evening in sync
 * while the app is open or returns to the foreground.
 */
export function useTimeOfDay(): TimeOfDayState {
   const [now, setNow] = useState(() => new Date());

   useEffect(() => {
      const refresh = () => setNow(new Date());

      const intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);

      const handleAppStateChange = (nextState: AppStateStatus) => {
         if (nextState === 'active') {
            refresh();
         }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
         clearInterval(intervalId);
         subscription.remove();
      };
   }, []);

   return useMemo(() => {
      const period = getTimeOfDayPeriod(now);
      return {
         period,
         greeting: getTimeOfDayGreeting(period),
         subtitle: getTimeOfDaySubtitle(period),
         hour: now.getHours(),
      };
   }, [now]);
}
