import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'expo-router';

interface TabNavigationContextType {
   previousRoute: string;
   currentRoute: string;
   previousPathname: string;
}

const TabNavigationContext = createContext<TabNavigationContextType | undefined>(undefined);

/**
 * Extract route name from pathname
 * Handles cases like "/(tabs)/index" -> "index" and "/(tabs)" -> "index"
 * Memoized function to avoid recreating on every call
 */
const getRouteFromPathname = (path: string): string => {
   const segments = path.split('/').filter(Boolean);
   const lastSegment = segments[segments.length - 1];

   // If pathname is just "/(tabs)" or ends with "(tabs)", default to "index"
   if (!lastSegment || lastSegment === '(tabs)') {
      return 'index';
   }

   return lastSegment;
};

/**
 * Provider component that tracks tab navigation state
 */
export const TabNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const pathname = usePathname();
   const previousPathnameRef = useRef<string>(pathname);
   const isInitializedRef = useRef<boolean>(false);

   // Initialize with current route
   const initialRoute = getRouteFromPathname(pathname);
   const [previousRoute, setPreviousRoute] = useState<string>(initialRoute);
   const [currentRoute, setCurrentRoute] = useState<string>(initialRoute);
   const [previousPathname, setPreviousPathname] = useState<string>(pathname);

   useEffect(() => {
      const route = getRouteFromPathname(pathname);
      const prevPath = previousPathnameRef.current;
      const prevRoute = getRouteFromPathname(prevPath);

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

