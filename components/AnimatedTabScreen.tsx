import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withTiming,
   Easing,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { colors } from '@/theme';
import { useTabNavigation } from '@/hooks/useTabNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedTabScreenProps {
   children: React.ReactNode;
   /**
    * Animation direction: 'left' means slide from left (appears from left to right)
    * 'right' means slide from right (appears from right to left)
    */
   direction: 'left' | 'right';
   /**
    * Previous route name to determine animation direction conditionally
    */
   previousRoute?: string;
   /**
    * Current route name - used to determine if this screen is active
    */
   currentRoute: string;
}

/**
 * Animated wrapper for tab screens that provides fade-in/fade-out and directional slide transitions
 * When the screen becomes active, it fades in and slides in from the specified direction.
 * When it becomes inactive, it fades out and slides out.
 */
export const AnimatedTabScreen: React.FC<AnimatedTabScreenProps> = ({
   children,
   direction,
   previousRoute,
   currentRoute,
}) => {
   const pathname = usePathname();
   const { previousPathname: contextPreviousPathname } = useTabNavigation();
   const translateX = useSharedValue(0);
   const opacity = useSharedValue(1);
   const isMountedRef = useRef(false);
   const previousPathnameRef = useRef<string>(pathname);
   const wasActiveRef = useRef(false);
   const animationInProgressRef = useRef(false);
   const hasNavigatedAfterMountRef = useRef(false);

   // Extract the route name from pathname (e.g., "/(tabs)/index" -> "index")
   // Memoized to avoid recreating on every render
   const getRouteFromPathname = useCallback((path: string): string => {
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];

      // If pathname is just "/(tabs)" or ends with "(tabs)", default to "index"
      if (!lastSegment || lastSegment === '(tabs)') {
         return 'index';
      }

      return lastSegment;
   }, []);

   // Check if this screen is currently active - memoized
   const isActive = useMemo((): boolean => {
      const pathRoute = getRouteFromPathname(pathname);
      return pathRoute === currentRoute;
   }, [pathname, currentRoute, getRouteFromPathname]);

   // Determine actual animation direction based on previous route - memoized
   const getAnimationDirection = useCallback((prevPath?: string, prevRoute?: string): 'left' | 'right' => {
      // If this is the "new-hot" screen, determine direction based on previous route
      if (currentRoute === 'new-hot') {
         // Try to get previous route from prop first
         let prevRouteName = previousRoute || prevRoute;

         // If not available, try to get from pathname
         if (!prevRouteName && prevPath) {
            prevRouteName = getRouteFromPathname(prevPath);
         }

         // Also try context previous pathname as fallback
         if (!prevRouteName && contextPreviousPathname) {
            prevRouteName = getRouteFromPathname(contextPreviousPathname);
         }

         if (prevRouteName === 'index') {
            // Coming from Home - slide from right to left
            return 'right';
         } else if (prevRouteName === 'profile') {
            // Coming from My AudioBook - slide from left to right
            return 'left';
         }
      }
      return direction;
   }, [currentRoute, previousRoute, contextPreviousPathname, direction, getRouteFromPathname]);

   // Initialize on mount
   useEffect(() => {
      wasActiveRef.current = isActive;

      if (isActive) {
         // Active screen on first render: visible and centered (no animation)
         opacity.value = 1;
         translateX.value = 0;
      } else {
         // Inactive screen: invisible and positioned off-screen
         opacity.value = 0;
         const actualDirection = getAnimationDirection(pathname);
         translateX.value = actualDirection === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
      }

      previousPathnameRef.current = pathname;
      isMountedRef.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []); // Only run once on mount - dependencies intentionally omitted

   // Handle pathname changes and animations
   useEffect(() => {
      // Don't animate on initial mount
      if (!isMountedRef.current) {
         return;
      }

      const pathnameChanged = previousPathnameRef.current !== pathname;

      // Also check if the route changed (more reliable than just pathname)
      const currentRouteName = getRouteFromPathname(pathname);
      const previousRouteName = getRouteFromPathname(previousPathnameRef.current);
      const routeChanged = currentRouteName !== previousRouteName;

      const activeStateChanged = isActive !== wasActiveRef.current;

      // Mark that navigation has occurred after mount if route or pathname changed
      if (pathnameChanged || routeChanged) {
         hasNavigatedAfterMountRef.current = true;
      }

      // Only proceed if something actually changed
      if (!pathnameChanged && !routeChanged && !activeStateChanged) {
         return;
      }

      // Prevent multiple simultaneous animations
      if (animationInProgressRef.current && (pathnameChanged || routeChanged)) {
         // If pathname/route changed while animation is in progress, update refs but skip animation
         wasActiveRef.current = isActive;
         previousPathnameRef.current = pathname;
         return;
      }

      // Determine if we're fading in or out
      // Always animate if route changed (this is the most reliable indicator of navigation)
      // Always animate on route change, even if it's the first navigation
      const shouldFadeIn = isActive && (
         routeChanged ||
         (!wasActiveRef.current && (hasNavigatedAfterMountRef.current || pathnameChanged))
      );

      // For fade out: screen becomes inactive AND (route changed OR it was active before)
      // Always animate on route change
      const shouldFadeOut = !isActive && (
         routeChanged ||
         (wasActiveRef.current && (hasNavigatedAfterMountRef.current || pathnameChanged))
      );

      // Get the previous pathname for direction calculation BEFORE updating refs
      const prevPath = (pathnameChanged || routeChanged) ? previousPathnameRef.current : contextPreviousPathname;

      // Update refs BEFORE animation
      wasActiveRef.current = isActive;
      previousPathnameRef.current = pathname;

      // Animate opacity and position based on active state
      if (shouldFadeIn || shouldFadeOut) {
         animationInProgressRef.current = true;
         const actualDirection = getAnimationDirection(prevPath);

         if (shouldFadeIn) {
            // Fade in and slide in: start off-screen, animate to center
            const initialX = actualDirection === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

            // Set initial position and opacity immediately to prevent flicker
            translateX.value = initialX;
            opacity.value = 0;

            // Use requestAnimationFrame to ensure layout is ready before animating
            requestAnimationFrame(() => {
               // Animate to center from the initial position
               translateX.value = withTiming(0, {
                  duration: 300,
                  easing: Easing.out(Easing.ease),
               });
               opacity.value = withTiming(1, {
                  duration: 300,
                  easing: Easing.out(Easing.ease),
               });

               // Reset animation flag after animation duration
               setTimeout(() => {
                  animationInProgressRef.current = false;
               }, 300);
            });
         } else {
            // Fade out and slide out: start at center, animate off-screen
            const targetX = actualDirection === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;
            translateX.value = withTiming(targetX, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });
            opacity.value = withTiming(0, {
               duration: 300,
               easing: Easing.out(Easing.ease),
            });

            // Reset animation flag after animation duration
            setTimeout(() => {
               animationInProgressRef.current = false;
            }, 300);
         }
      }
   }, [pathname, currentRoute, previousRoute, direction, contextPreviousPathname, isActive, getRouteFromPathname, getAnimationDirection]);

   // Safety check: ensure screen is visible when active
   useEffect(() => {
      if (!isMountedRef.current) {
         return;
      }

      // If screen is active, ensure it's visible
      if (isActive) {
         const isNotVisible = opacity.value < 0.1 || Math.abs(translateX.value) > 1;

         // Only handle if screen is not visible and animation is not in progress
         if (isNotVisible && !animationInProgressRef.current) {
            // Screen is active but not visible - animate it in
            const prevPath = contextPreviousPathname || previousPathnameRef.current;
            const actualDirection = getAnimationDirection(prevPath);
            const initialX = actualDirection === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

            animationInProgressRef.current = true;
            translateX.value = initialX;
            opacity.value = 0;

            requestAnimationFrame(() => {
               translateX.value = withTiming(0, {
                  duration: 300,
                  easing: Easing.out(Easing.ease),
               });
               opacity.value = withTiming(1, {
                  duration: 300,
                  easing: Easing.out(Easing.ease),
               });

               // Reset animation flag after animation duration
               setTimeout(() => {
                  animationInProgressRef.current = false;
               }, 300);
            });

            wasActiveRef.current = true;
         } else if (isActive && !wasActiveRef.current && !animationInProgressRef.current) {
            // Screen is active but ref wasn't updated - ensure visibility immediately
            translateX.value = 0;
            opacity.value = 1;
            wasActiveRef.current = true;
         }
      }
   }, [pathname, currentRoute, previousRoute, contextPreviousPathname, isActive, getAnimationDirection]);

   const animatedStyle = useAnimatedStyle(() => {
      return {
         transform: [{ translateX: translateX.value }],
         opacity: opacity.value,
      };
   });

   return (
      <Animated.View style={[styles.container, animatedStyle]}>
         {children}
      </Animated.View>
   );
};

// Memoize component to prevent unnecessary re-renders
export const AnimatedTabScreenMemo = React.memo(AnimatedTabScreen);

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
      width: '100%',
   },
});

