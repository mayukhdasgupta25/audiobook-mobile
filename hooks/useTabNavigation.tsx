import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'expo-router';

interface TabNavigationContextType {
   previousRoute: string;
   currentRoute: string;
   previousPathname: string;
}

const TabNavigationContext = createContext<TabNavigationContextType | undefined>(undefined);

/** Tab screen names under app/(tabs)/ — used when pathname omits the (tabs) group prefix. */
const TAB_SCREEN_NAMES = new Set([
   'index',
   'library',
   'discover',
   'profile',
   'new-hot',
]);

/**
 * True for tab navigator routes only (not stack overlays like /details or /library/playlists).
 * Expo Router may report "/(tabs)/library" or "/library" depending on platform/version.
 */
export function isTabGroupPathname(path: string): boolean {
   if (!path || path === '/') {
      return true;
   }
   if (path.includes('(tabs)')) {
      return true;
   }
   const segments = path.split('/').filter(Boolean);
   return segments.length === 1 && TAB_SCREEN_NAMES.has(segments[0]);
}

/**
 * Extract tab route name from pathname.
 * e.g. "/(tabs)/library" or "/library" -> "library"
 */
export function getTabRouteFromPathname(path: string): string {
   if (!path || path === '/') {
      return 'index';
   }
   const segments = path.split('/').filter(Boolean);
   const tabsIndex = segments.indexOf('(tabs)');

   if (tabsIndex >= 0) {
      const routeAfterTabs = segments[tabsIndex + 1];
      if (!routeAfterTabs || routeAfterTabs === '(tabs)') {
         return 'index';
      }
      return routeAfterTabs;
   }

   if (segments.length === 1 && TAB_SCREEN_NAMES.has(segments[0])) {
      return segments[0];
   }

   return 'index';
}

/**
 * Provider component that tracks tab navigation state
 */
export const TabNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const pathname = usePathname();
   const previousPathnameRef = useRef<string>(pathname);
   const isInitializedRef = useRef<boolean>(false);

   // Initialize with current route
   const initialRoute = getTabRouteFromPathname(pathname);
   const [previousRoute, setPreviousRoute] = useState<string>(initialRoute);
   const [currentRoute, setCurrentRoute] = useState<string>(initialRoute);
   const [previousPathname, setPreviousPathname] = useState<string>(pathname);

   useEffect(() => {
      // Stack screens (details, library/*, etc.) sit above tabs — keep tab route state frozen.
      if (!isTabGroupPathname(pathname)) {
         return;
      }

      const route = getTabRouteFromPathname(pathname);
      const prevPath = previousPathnameRef.current;
      const prevRoute = getTabRouteFromPathname(prevPath);

      // On first render, just initialize without triggering navigation
      if (!isInitializedRef.current) {
         isInitializedRef.current = true;
         previousPathnameRef.current = pathname;
         setCurrentRoute(route);
         setPreviousRoute(route);
         setPreviousPathname(pathname);
         return;
      }

      // Only update if route actually changed
      if (route !== currentRoute || pathname !== previousPathnameRef.current) {
         setPreviousRoute(prevRoute);
         setCurrentRoute(route);
         setPreviousPathname(prevPath);
         previousPathnameRef.current = pathname;
      }
   }, [pathname, currentRoute]);

   // Memoize context value to prevent unnecessary re-renders of consumers
   const contextValue = useMemo(
      () => ({
         previousRoute,
         currentRoute,
         previousPathname,
      }),
      [previousRoute, currentRoute, previousPathname]
   );

   return (
      <TabNavigationContext.Provider value={contextValue}>
         {children}
      </TabNavigationContext.Provider>
   );
};

/**
 * Hook to access tab navigation context
 * Returns default values if context is not available (for initial render)
 */
export const useTabNavigation = () => {
   const context = useContext(TabNavigationContext);
   if (!context) {
      // Return default values instead of throwing to prevent render errors
      // This can happen during initial render before context is set up
      return { previousRoute: 'index', currentRoute: 'index', previousPathname: '/(tabs)/index' };
   }
   return context;
};

