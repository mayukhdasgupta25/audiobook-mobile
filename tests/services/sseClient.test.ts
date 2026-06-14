import { connectSseStream, parseSseBuffer } from '@/services/sseClient';
import { createMockXmlHttpRequest } from '../utils/mockXmlHttpRequest';

describe('sseClient', () => {
   describe('parseSseBuffer', () => {
      it('parses cache-invalidate events and ignores heartbeats', () => {
         const buffer =
            ': heartbeat\n\n' +
            'event: cache-invalidate\n' +
            'data: {"version":1,"service":"app","resource":"audiobook","action":"updated","id":"ab-1","queryKeys":[["audiobooks"]],"timestamp":"2026-06-13T00:00:00.000Z"}\n\n';

         const { messages, remainder } = parseSseBuffer(buffer);

         expect(messages).toEqual([
            {
               event: 'cache-invalidate',
               data: '{"version":1,"service":"app","resource":"audiobook","action":"updated","id":"ab-1","queryKeys":[["audiobooks"]],"timestamp":"2026-06-13T00:00:00.000Z"}',
            },
         ]);
         expect(remainder).toBe('');
      });

      it('keeps partial events in the remainder buffer', () => {
         const { messages, remainder } = parseSseBuffer('event: cache-invalidate\ndata: {"version":');

         expect(messages).toEqual([]);
         expect(remainder).toBe('event: cache-invalidate\ndata: {"version":');
      });
   });

   describe('connectSseStream', () => {
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

      it('invokes onMessage for streamed SSE payloads', async () => {
         const controller = new AbortController();
         const onMessage = jest.fn();

         const connectPromise = connectSseStream({
            url: 'http://example.com/events/stream',
            headers: { Authorization: 'Bearer token' },
            signal: controller.signal,
            onMessage,
         });

         xhr.readyState = XMLHttpRequest.HEADERS_RECEIVED;
         xhr.onreadystatechange?.();

         xhr.responseText =
            'event: cache-invalidate\n' +
            'data: {"version":1,"service":"app","resource":"audiobook","action":"updated","id":"ab-1","queryKeys":[["audiobooks"]],"timestamp":"2026-06-13T00:00:00.000Z"}\n\n';
         xhr.onprogress?.();

         expect(onMessage).toHaveBeenCalledWith({
            event: 'cache-invalidate',
            data: '{"version":1,"service":"app","resource":"audiobook","action":"updated","id":"ab-1","queryKeys":[["audiobooks"]],"timestamp":"2026-06-13T00:00:00.000Z"}',
         });

         controller.abort();
         await connectPromise;
      });

      it('rejects when the stream closes unexpectedly', async () => {
         const controller = new AbortController();
         const onError = jest.fn();

         const connectPromise = connectSseStream({
            url: 'http://example.com/events/stream',
            signal: controller.signal,
            onMessage: jest.fn(),
            onError,
         });

         xhr.readyState = XMLHttpRequest.HEADERS_RECEIVED;
         xhr.onreadystatechange?.();

         xhr.readyState = XMLHttpRequest.DONE;
         xhr.onreadystatechange?.();

         await expect(connectPromise).rejects.toThrow('SSE connection closed');
         expect(onError).toHaveBeenCalled();
      });
   });
});
