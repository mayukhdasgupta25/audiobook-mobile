import { useDomainEventsSync } from '@/hooks/useDomainEventsSync';

/**
 * Headless component that keeps SSE cache-invalidation streams connected while authenticated.
 */
export function DomainEventsSync(): null {
   useDomainEventsSync();
   return null;
}
