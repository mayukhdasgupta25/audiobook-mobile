import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor, initializeApp } from '@/store';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { colors } from '@/theme';
import SplashScreen from '@/components/SplashScreen';
import '../global.css';

// Create a client for TanStack Query outside component to prevent recreation on every render
// This ensures the QueryClient instance is stable across re-renders
export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         retry: (failureCount, error) => {
            // Don't retry on 401 (unauthorized) errors - they're handled globally by API service
            if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
               // Handle 401 error (API service already handles it, but ensure we don't retry)
               return false;
            }
            // Retry up to 2 times for other errors
            return failureCount < 2;
         },
         refetchOnWindowFocus: false,
         staleTime: 5 * 60 * 1000, // 5 minutes - cache data for better performance
         gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
      },
      mutations: {
         retry: (failureCount, error) => {
            // Don't retry on 401 (unauthorized) errors
            if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
               return false;
            }
            // Retry up to 2 times for other errors
            return failureCount < 2;
         },
      },
   },
   // Global error handlers using queryCache and mutationCache
   queryCache: new QueryCache({
      onError: async (error: unknown) => {
         // Handle 401 errors globally - logout and redirect to signin
         if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 401) {
            const { checkAndHandle401Error } = require('@/utils/apiErrorHandler');
            const { ApiError } = require('@/services/api');
            const apiError = error instanceof ApiError
               ? error
               : new ApiError(401, 'Unauthorized', error);
            await checkAndHandle401Error(apiError, false);
         }
      },
   }),
   mutationCache: new MutationCache({
      onError: async (error: unknown) => {
         // Handle 401 errors globally - logout and redirect to signin
         if (error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 401) {
            const { checkAndHandle401Error } = require('@/utils/apiErrorHandler');
            const { ApiError } = require('@/services/api');
            const apiError = error instanceof ApiError
               ? error
               : new ApiError(401, 'Unauthorized', error);
            await checkAndHandle401Error(apiError, false);
         }
      },
   }),
});

/**
 * Inner layout component that handles auth-based routing
 */
function InnerLayout() {
   const segments = useSegments();
   // Memoize selectors to prevent unnecessary re-renders
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const [isAppReady, setIsAppReady] = useState(false);
   const [showSplash, setShowSplash] = useState(true);
   const hasSetInitialRoute = useRef(false);
   const splashStartTime = useRef<number>(Date.now());

   useEffect(() => {
      // Initialize auth state on app startup
      const init = async () => {
         await initializeApp();
         setIsAppReady(true);
      };
      init();

      // Fallback: ensure app renders after 2 seconds even if initialization fails
      const fallbackTimeout = setTimeout(() => {
         setIsAppReady(true);
      }, 2000);

      return () => clearTimeout(fallbackTimeout);
   }, []);

   // Hide splash screen after auth initialization completes
   // Ensure minimum splash display duration of 1 second for better UX
   useEffect(() => {
      if (isAppReady && isInitialized) {
         const elapsed = Date.now() - splashStartTime.current;
         const minDisplayTime = 1000; // 1 second minimum

         if (elapsed < minDisplayTime) {
            const remainingTime = minDisplayTime - elapsed;
            setTimeout(() => {
               setShowSplash(false);
            }, remainingTime);
         } else {
            setShowSplash(false);
         }
      }
   }, [isAppReady, isInitialized]);

   // Set initial route based on auth state once initialized (only once)
   useEffect(() => {
      if (!isAppReady || !isInitialized || hasSetInitialRoute.current || showSplash) {
         return; // Wait for app to initialize, auth to initialize, or splash to hide
      }

      // Set initial route based on authentication state
      hasSetInitialRoute.current = true;
      if (!isAuthenticated) {
         // User is not authenticated, navigate to signin
         router.replace('/signin');
      } else {
         // User is authenticated, navigate to home
         router.replace('/(tabs)');
      }
   }, [isAppReady, isInitialized, isAuthenticated, showSplash]);

   // Handle route changes after initial load
   useEffect(() => {
      if (!isAppReady || !isInitialized || showSplash) {
         return; // Wait for app to initialize and splash to hide
      }

      const inAuthGroup =
         segments[0] === '(tabs)' ||
         segments[0] === 'details' ||
         segments[0] === 'search';

      if (!isAuthenticated && inAuthGroup) {
         // User is not authenticated but trying to access protected route
         router.replace('/signin');
      } else if (isAuthenticated && (segments[0] === 'signin' || segments[0] === 'signup')) {
         // User is authenticated but on auth pages, redirect to home
         router.replace('/(tabs)');
      }
   }, [isAuthenticated, isInitialized, isAppReady, segments, showSplash]);

   // Show splash screen while initializing or during minimum display time
   if (showSplash) {
      return <SplashScreen />;
   }

   return (
      <Stack
         screenOptions={{
            headerShown: false,
            contentStyle: {
               backgroundColor: colors.background.dark,
            },
         }}
      >
         <Stack.Screen
            name="(tabs)"
            options={{
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <Stack.Screen
            name="details/[id]"
            options={{
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <Stack.Screen
            name="search"
            options={{
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <Stack.Screen
            name="signin"
            options={{
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <Stack.Screen
            name="signup"
            options={{
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
      </Stack>
   );
}

export default function RootLayout() {
   return (
      <SafeAreaProvider>
         <View style={{ flex: 1, backgroundColor: colors.background.dark }}>
            <Provider store={store}>
               <PersistGate loading={null} persistor={persistor}>
                  <QueryClientProvider client={queryClient}>
                     <StatusBar style="light" />
                     <InnerLayout />
                  </QueryClientProvider>
               </PersistGate>
            </Provider>
         </View>
      </SafeAreaProvider>
   );
}

