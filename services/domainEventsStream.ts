import { AUTH_API_BASE_URL, getMainApiUrl } from '@/services/api';
import { connectSseStream } from '@/services/sseClient';
import {
   CACHE_INVALIDATE_SSE_EVENT,
   type CacheInvalidateEvent,
   type DomainEventStreamOptions,
} from '@/types/domainCacheEvents';

function streamUrl(kind: DomainEventStreamOptions['kind']): string {
   if (kind === 'auth') {
      return `${AUTH_API_BASE_URL}/auth/events/stream`;
   }
   return `${getMainApiUrl()}/api/v1/events/stream`;
}

export function parseCacheInvalidateEvent(data: string): CacheInvalidateEvent | null {
   try {
      const parsed = JSON.parse(data) as CacheInvalidateEvent;
      if (
         parsed?.version !== 1 ||
         !Array.isArray(parsed.queryKeys) ||
         (parsed.service !== 'auth' && parsed.service !== 'app')
      ) {
         return null;
      }
      return parsed;
   } catch {
      return null;
   }
}

/**
 * Opens an authenticated SSE stream and invokes onInvalidate for cache-invalidate events.
 * Resolves when the connection closes or the abort signal fires.
 */
export async function connectDomainEventStream(
   options: DomainEventStreamOptions
): Promise<void> {
   const { kind, accessToken, onInvalidate, onError, signal } = options;
   const url = streamUrl(kind);

   await connectSseStream({
      url,
      headers: {
         Authorization: `Bearer ${accessToken}`,
         Accept: 'text/event-stream',
      },
      signal,
      onOpen: (status) => {
         if (status === 401) {
            throw new DomainEventStreamAuthError();
         }
         if (status !== 200) {
            throw new Error(`SSE connection failed (${status})`);
         }
      },
      onMessage: (message) => {
         if (message.event !== CACHE_INVALIDATE_SSE_EVENT || !message.data) {
            return;
         }
         const event = parseCacheInvalidateEvent(message.data);
         if (event) {
            onInvalidate(event);
         }
      },
      onError,
   });
}

export class DomainEventStreamAuthError extends Error {
   constructor() {
      super('SSE authentication failed');
      this.name = 'DomainEventStreamAuthError';
   }
}
