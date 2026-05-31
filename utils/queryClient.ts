import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for the app.
 * Error handlers are loaded dynamically to avoid require cycles with logout/auth.
 */
export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         retry: (failureCount, error) => {
            if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
               return false;
            }
            return failureCount < 2;
         },
         refetchOnWindowFocus: false,
         staleTime: 10 * 1000,
         gcTime: 1 * 60 * 1000,
      },
      mutations: {
         retry: (failureCount, error) => {
            if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
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
