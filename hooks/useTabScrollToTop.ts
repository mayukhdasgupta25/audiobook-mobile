import { useEffect, type RefObject } from 'react';
import type { ScrollView } from 'react-native';

type ScrollHandler = () => void;

const scrollHandlers = new Map<string, Set<ScrollHandler>>();

export function registerTabScrollHandler(
   tabRoute: string,
   handler: ScrollHandler
): () => void {
   if (!scrollHandlers.has(tabRoute)) {
      scrollHandlers.set(tabRoute, new Set());
   }
   const handlers = scrollHandlers.get(tabRoute)!;
   handlers.add(handler);
   return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
         scrollHandlers.delete(tabRoute);
      }
   };
}

export function scrollTabToTop(tabRoute: string): void {
   scrollHandlers.get(tabRoute)?.forEach((handler) => {
      handler();
   });
}

/**
 * Registers a tab screen's main ScrollView so tapping the active tab bar icon scrolls to top.
 */
export function useTabScrollToTop(
   tabRoute: string,
   scrollRef: RefObject<ScrollView | null>
): void {
   useEffect(() => {
      const handler = () => {
         scrollRef.current?.scrollTo({ y: 0, animated: true });
      };
      return registerTabScrollHandler(tabRoute, handler);
   }, [tabRoute, scrollRef]);
}
