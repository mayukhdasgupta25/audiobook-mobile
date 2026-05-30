/**
 * Shared auth gate for TanStack Query hooks
 */

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function useAuthQueryEnabled(extraCondition = true): boolean {
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   return extraCondition && isAuthenticated && isInitialized;
}
