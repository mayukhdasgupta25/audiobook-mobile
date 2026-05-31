import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { Stack, router, useSegments, type Href } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor, initializeApp } from '@/store';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { colors } from '@/theme';
import SplashScreen from '@/components/SplashScreen';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AudioPlaybackProvider } from '@/contexts/AudioPlaybackContext';
import { configureGoogleSignIn } from '@/services/auth';
import { useTrackPlayerSetup } from '@/hooks/useTrackPlayerSetup';
import * as Linking from 'expo-linking';
import { usePlaybackNotificationLinking } from '@/hooks/usePlaybackNotificationLinking';
import { usePlaybackReturnPathTracker } from '@/hooks/usePlaybackReturnPathTracker';
import { useDeviceLocationOnAppLoad } from '@/hooks/useDeviceLocationOnAppLoad';
import { useUserLocationSync } from '@/hooks/useUserLocationSync';
import { isTrackPlayerNotificationUrl } from '@/utils/playbackNotificationNavigation';
import { resolvePersistedPlaybackRoute } from '@/utils/playbackReturnPathStorage';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toast } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { preloadAppAssets } from '@/utils/preloadAppAssets';
import '../global.css';

// Initialize Reactotron in development mode
if (__DEV__) {
   // eslint-disable-next-line @typescript-eslint/no-require-imports
   require('../config/ReactotronConfig');
}

/**
 * Inner layout component that handles auth-based routing
 */
function InnerLayout() {
   useTrackPlayerSetup();
   const segments = useSegments();
   // Memoize selectors to prevent unnecessary re-renders
   const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated
   );
   const isInitialized = useSelector(
      (state: RootState) => state.auth.isInitialized
   );
   const requiresOnboarding = useSelector(
      (state: RootState) => state.auth.requiresOnboarding
   );
   const profileFetched = useSelector(
      (state: RootState) => state.auth.profileFetched
   );
   const [isAppReady, setIsAppReady] = useState(false);
   const [showSplash, setShowSplash] = useState(true);
   const hasSetInitialRoute = useRef(false);
   const splashStartTime = useRef<number>(Date.now());

   usePlaybackReturnPathTracker();
   usePlaybackNotificationLinking(isAppReady && isInitialized && !showSplash);
   useDeviceLocationOnAppLoad(isAppReady);
   useUserLocationSync(isAppReady);

   useEffect(() => {
      // Initialize auth state on app startup
      const init = async () => {
         // Configure Google Sign-In
         configureGoogleSignIn();
         await Promise.all([initializeApp(), preloadAppAssets()]);
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

      hasSetInitialRoute.current = true;

      void (async () => {
         if (!isAuthenticated) {
            router.replace('/signin');
            return;
         }

         const initialUrl = await Linking.getInitialURL();
         if (isTrackPlayerNotificationUrl(initialUrl)) {
            const returnRoute = await resolvePersistedPlaybackRoute();
            if (returnRoute) {
               router.replace(returnRoute as Href);
               return;
            }
         }

         if (requiresOnboarding) {
            router.replace('/onboarding/age' as Href);
            return;
         }

         router.replace('/(tabs)');
      })();
   }, [isAppReady, isInitialized, isAuthenticated, requiresOnboarding, showSplash]);

   // Handle route changes after initial load
   useEffect(() => {
      if (!isAppReady || !isInitialized || showSplash) {
         return; // Wait for app to initialize and splash to hide
      }

      const inOnboarding = String(segments[0]) === 'onboarding';
      const inAuthGroup =
         segments[0] === '(tabs)' ||
         segments[0] === 'details' ||
         segments[0] === 'search' ||
         segments[0] === 'library' ||
         segments[0] === 'playlists' ||
         String(segments[0]) === 'moods' ||
         segments[0] === 'account' ||
         String(segments[0]) === 'settings' ||
         segments[0] === 'subscription-plans' ||
         segments[0] === 'update-first-name' ||
         segments[0] === 'update-last-name' ||
         segments[0] === 'update-avatar' ||
         segments[0] === 'change-password' ||
         segments[0] === 'change-email' ||
         segments[0] === 'verify-password-otp' ||
         segments[0] === 'verify-email-otp' ||
         inOnboarding;

      const onAuthScreen =
         segments[0] === 'signin' ||
         segments[0] === 'signup' ||
         segments[0] === 'verify-otp';

      if (!isAuthenticated && inAuthGroup) {
         // User is not authenticated but trying to access protected route
         router.replace('/signin');
      } else if (isAuthenticated && requiresOnboarding && !inOnboarding) {
         router.replace('/onboarding/age' as Href);
      } else if (isAuthenticated && !requiresOnboarding && (onAuthScreen || inOnboarding)) {
         // Wait for profile after OAuth so incomplete profiles can trigger onboarding first
         if (onAuthScreen && !profileFetched) {
            return;
         }
         router.replace('/(tabs)');
      }
   }, [
      isAuthenticated,
      requiresOnboarding,
      profileFetched,
      isInitialized,
      isAppReady,
      segments,
      showSplash,
   ]);

   // Show splash screen while initializing or during minimum display time
   if (showSplash) {
      return <SplashScreen />;
   }

   return (
      <AudioPlaybackProvider>
         <Stack
            screenOptions={{
               headerShown: false,
               contentStyle: {
                  backgroundColor: colors.background.screen,
               },
            }}
         >
            <Stack.Screen
               name="(tabs)"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="details/[id]"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="search"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="signin"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="signup"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="verify-otp"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="verify-password-otp"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="verify-email-otp"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="change-password"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="change-email"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="update-first-name"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="update-last-name"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="update-avatar"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="account"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="subscription-plans"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="manage-devices"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="verify-device-removal-otp"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="chapter-comments"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="publisher/[id]"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="playlists/[id]"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="library"
               options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
               }}
            />
            <Stack.Screen
               name="onboarding"
               options={{
                  contentStyle: {
                     backgroundColor: colors.background.screen,
                  },
                  gestureEnabled: false,
               }}
            />
         </Stack>

         {/* Playback stays mounted app-wide; player UI hides when not visible */}
         <AudioPlayer />
      </AudioPlaybackProvider>
   );
}

export default function RootLayout() {
   return (
      <GestureHandlerRootView style={{ flex: 1 }}>
         <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <ToastProvider>
               <ErrorBoundary>
                  <View style={{ flex: 1, backgroundColor: colors.background.screen }}>
                     <Provider store={store}>
                        <PersistGate loading={null} persistor={persistor}>
                           <QueryClientProvider client={queryClient}>
                              <StatusBar style="dark" />
                              <InnerLayout />
                              <Toast />
                           </QueryClientProvider>
                        </PersistGate>
                     </Provider>
                  </View>
               </ErrorBoundary>
            </ToastProvider>
         </SafeAreaProvider>
      </GestureHandlerRootView>
   );
}

