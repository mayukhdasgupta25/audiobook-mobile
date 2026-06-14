import {
   connectDomainEventStream,
   parseCacheInvalidateEvent,
   DomainEventStreamAuthError,
} from '@/services/domainEventsStream';
import { CACHE_INVALIDATE_SSE_EVENT } from '@/types/domainCacheEvents';
import { createMockXmlHttpRequest } from '../utils/mockXmlHttpRequest';

jest.mock('@/services/api', () => ({
   AUTH_API_BASE_URL: 'http://auth.test',
   getMainApiUrl: () => 'http://app.test',
}));

describe('domainEventsStream', () => {
   describe('parseCacheInvalidateEvent', () => {
      it('parses valid cache-invalidate payload', () => {
         const payload = {
            version: 1,
            service: 'app',
            resource: 'audiobook',
            action: 'updated',
            id: 'ab-1',
            queryKeys: [['audiobooks'], ['audiobooks', 'ab-1']],
            timestamp: '2026-06-13T00:00:00.000Z',
         };

         expect(parseCacheInvalidateEvent(JSON.stringify(payload))).toEqual(payload);
      });

      it('returns null for invalid payload', () => {
         expect(parseCacheInvalidateEvent('not-json')).toBeNull();
         expect(parseCacheInvalidateEvent(JSON.stringify({ version: 2 }))).toBeNull();
      });
   });

   it('exports cache-invalidate event name constant', () => {
      expect(CACHE_INVALIDATE_SSE_EVENT).toBe('cache-invalidate');
   });

   it('DomainEventStreamAuthError has expected name', () => {
      expect(new DomainEventStreamAuthError().name).toBe('DomainEventStreamAuthError');
   });

   describe('connectDomainEventStream', () => {
      let xhr: ReturnType<typeof createMockXmlHttpRequest>['xhr'];
      let restore: () => void;

      beforeEach(() => {
         const mock = createMockXmlHttpRequest();
         xhr = mock.xhr;
         mock.install();
         restore = mock.restore;
      });

      afterEach(() => {
         restore();
      });

      it('opens the auth events stream with bearer auth', async () => {
         const controller = new AbortController();
         const onInvalidate = jest.fn();

         const connectPromise = connectDomainEventStream({
            kind: 'auth',
            accessToken: 'token-123',
            signal: controller.signal,
            onInvalidate,
         });

         expect(xhr.open).toHaveBeenCalledWith('GET', 'http://auth.test/auth/events/stream');
         expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer token-123');

         xhr.readyState = XMLHttpRequest.HEADERS_RECEIVED;
         xhr.onreadystatechange?.();

         xhr.responseText =
            'event: cache-invalidate\n' +
            'data: {"version":1,"service":"auth","resource":"user","action":"updated","id":"user-1","queryKeys":[["user-profile"]],"timestamp":"2026-06-13T00:00:00.000Z"}\n\n';
         xhr.onprogress?.();

         expect(onInvalidate).toHaveBeenCalledWith({
            version: 1,
            service: 'auth',
            resource: 'user',
            action: 'updated',
            id: 'user-1',
            queryKeys: [['user-profile']],
            timestamp: '2026-06-13T00:00:00.000Z',
         });

         controller.abort();
         await connectPromise;
      });

      it('throws DomainEventStreamAuthError on 401', async () => {
         const controller = new AbortController();
         xhr.status = 401;

         const connectPromise = connectDomainEventStream({
            kind: 'app',
            accessToken: 'expired-token',
            signal: controller.signal,
            onInvalidate: jest.fn(),
         });

         xhr.readyState = XMLHttpRequest.HEADERS_RECEIVED;
         xhr.onreadystatechange?.();

         await expect(connectPromise).rejects.toBeInstanceOf(DomainEventStreamAuthError);
      });
   });
});
