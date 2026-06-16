export type DomainAction = 'created' | 'updated' | 'deleted';

export type AuthDomainResource =
   | 'user'
   | 'user-profile'
   | 'author'
   | 'organization'
   | 'organization-member'
   | 'subscription-plan'
   | 'user-subscription'
   | 'user-device';

export type AppDomainResource =
   | 'audiobook'
   | 'chapter'
   | 'comment'
   | 'review'
   | 'user-profile'
   | 'author-profile'
   | 'playlist'
   | 'playlist-item'
   | 'favorite'
   | 'bookmark'
   | 'note'
   | 'tag'
   | 'genre'
   | 'mood'
   | 'user-audiobook'
   | 'offline-download';

export interface AuthCacheInvalidateEvent {
   version: 1;
   service: 'auth';
   resource: AuthDomainResource;
   action: DomainAction;
   id: string;
   queryKeys: string[][];
   relatedIds?: Record<string, string>;
   timestamp: string;
}

export interface AppCacheInvalidateEvent {
   version: 1;
   service: 'app';
   resource: AppDomainResource;
   action: DomainAction;
   id: string;
   queryKeys: string[][];
   relatedIds?: Record<string, string>;
   timestamp: string;
}

export type CacheInvalidateEvent = AuthCacheInvalidateEvent | AppCacheInvalidateEvent;

export const CACHE_INVALIDATE_SSE_EVENT = 'cache-invalidate';

export type DomainEventStreamKind = 'auth' | 'app';

export interface DomainEventStreamOptions {
   kind: DomainEventStreamKind;
   accessToken: string;
   onInvalidate: (event: CacheInvalidateEvent) => void;
   onError?: (error: unknown) => void;
   signal: AbortSignal;
}
