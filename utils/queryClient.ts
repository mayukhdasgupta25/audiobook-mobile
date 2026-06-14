import { AppState } from 'react-native';
import { QueryClient, QueryCache, MutationCache, focusManager } from '@tanstack/react-query';
import { ApiError } from '@/services/api';
import { shouldRetryQuery } from '@/utils/queryRetry';

/**
 * React Native focus integration — refetch stale queries when app returns to foreground.
 */
focusManager.setEventListener((handleFocus) => {
   const subscription = AppState.addEventListener('change', (status) => {
      handleFocus(status === 'active');
   });
   return () => subscription.remove();
});

/**
 * Shared TanStack Query client for the app.
 * Error handlers are loaded dynamically to avoid require cycles with logout/auth.
 */
export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         retry: shouldRetryQuery,
         refetchOnWindowFocus: true,
         refetchOnReconnect: true,
         staleTime: 5 * 60 * 1000,
         gcTime: 2 * 60 * 1000,
      },
      mutations: {
         retry: (failureCount, error) => {
            if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
               return false;
            }
            return failureCount < 2;
         },
      },
   },
   queryCache: new QueryCache({
      onError: async (error: unknown, query) => {
         const { handleGlobalQueryError } = await import('@/utils/queryErrorToast');
         await handleGlobalQueryError(error, query.meta);
      },
   }),
   mutationCache: new MutationCache({
      onError: async (error: unknown) => {
         const { handleGlobalMutationError } = await import('@/utils/queryErrorToast');
         await handleGlobalMutationError(error);
      },
   }),
});
