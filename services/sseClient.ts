export interface SseMessage {
   event?: string;
   data?: string;
}

export interface SseConnectOptions {
   url: string;
   headers?: Record<string, string>;
   signal: AbortSignal;
   onOpen?: (status: number) => void | Promise<void>;
   onMessage: (message: SseMessage) => void;
   onError?: (error: unknown) => void;
}

function findEventDelimiter(buffer: string, from: number): number {
   for (let index = from; index < buffer.length - 1; index += 1) {
      if (buffer[index] === '\n' && buffer[index + 1] === '\n') {
         return index;
      }
      if (
         buffer[index] === '\r' &&
         buffer[index + 1] === '\n' &&
         index + 3 < buffer.length &&
         buffer[index + 2] === '\r' &&
         buffer[index + 3] === '\n'
      ) {
         return index;
      }
   }
   return -1;
}

function delimiterLength(buffer: string, index: number): number {
   return buffer[index] === '\r' ? 4 : 2;
}

function parseSseEventBlock(block: string): SseMessage | null {
   const lines = block.split(/\r?\n/);
   let event: string | undefined;
   const dataLines: string[] = [];

   for (const line of lines) {
      if (line.startsWith(':')) {
         continue;
      }
      if (line.startsWith('event:')) {
         event = line.slice('event:'.length).trimStart();
      } else if (line.startsWith('data:')) {
         dataLines.push(line.slice('data:'.length).trimStart());
      }
   }

   if (dataLines.length === 0) {
      return null;
   }

   return { event, data: dataLines.join('\n') };
}

/** Parses complete SSE event blocks from a buffer, returning any trailing partial block. */
export function parseSseBuffer(buffer: string): { messages: SseMessage[]; remainder: string } {
   const messages: SseMessage[] = [];
   let searchStart = 0;

   while (true) {
      const delimiterIndex = findEventDelimiter(buffer, searchStart);
      if (delimiterIndex === -1) {
         return { messages, remainder: buffer.slice(searchStart) };
      }

      const rawEvent = buffer.slice(searchStart, delimiterIndex);
      searchStart = delimiterIndex + delimiterLength(buffer, delimiterIndex);

      const message = parseSseEventBlock(rawEvent);
      if (message) {
         messages.push(message);
      }
   }
}

/**
 * Opens an SSE stream using XMLHttpRequest so it works on React Native.
 * Resolves when aborted; rejects when the stream closes unexpectedly or fails to open.
 */
export function connectSseStream(options: SseConnectOptions): Promise<void> {
   const { url, headers = {}, signal, onOpen, onMessage, onError } = options;

   return new Promise((resolve, reject) => {
      if (signal.aborted) {
         resolve();
         return;
      }

      const xhr = new XMLHttpRequest();
      let settled = false;
      let opened = false;
      let processedLength = 0;
      let parseBuffer = '';

      const cleanup = (): void => {
         signal.removeEventListener('abort', onAbort);
         xhr.onreadystatechange = null;
         xhr.onprogress = null;
         xhr.onerror = null;
      };

      const finishResolve = (): void => {
         if (settled) {
            return;
         }
         settled = true;
         cleanup();
         resolve();
      };

      const finishReject = (error: unknown): void => {
         if (settled) {
            return;
         }
         settled = true;
         cleanup();
         try {
            xhr.abort();
         } catch {
            // Ignore abort errors during teardown.
         }
         onError?.(error);
         reject(error);
      };

      const onAbort = (): void => {
         try {
            xhr.abort();
         } catch {
            // Ignore abort errors during teardown.
         }
         finishResolve();
      };

      const processNewText = (text: string): void => {
         if (text.length <= processedLength) {
            return;
         }

         const chunk = text.slice(processedLength);
         processedLength = text.length;
         parseBuffer += chunk;

         const parsed = parseSseBuffer(parseBuffer);
         parseBuffer = parsed.remainder;
         for (const message of parsed.messages) {
            onMessage(message);
         }
      };

      signal.addEventListener('abort', onAbort);

      xhr.open('GET', url);
      for (const [key, value] of Object.entries(headers)) {
         xhr.setRequestHeader(key, value);
      }

      xhr.onreadystatechange = () => {
         if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && !opened) {
            opened = true;
            void (async () => {
               try {
                  await onOpen?.(xhr.status);
                  if (xhr.status !== 200) {
                     finishReject(new Error(`SSE connection failed (${xhr.status})`));
                  }
               } catch (error) {
                  finishReject(error);
               }
            })();
         }

         if (xhr.readyState === XMLHttpRequest.DONE) {
            processNewText(xhr.responseText);

            if (signal.aborted) {
               finishResolve();
               return;
            }

            if (xhr.status !== 200) {
               if (!opened) {
                  finishReject(new Error(`SSE connection failed (${xhr.status})`));
               } else {
                  finishReject(new Error('SSE connection closed'));
               }
               return;
            }

            finishReject(new Error('SSE connection closed'));
         }
      };

      xhr.onprogress = () => {
         processNewText(xhr.responseText);
      };

      xhr.onerror = () => {
         if (signal.aborted) {
            finishResolve();
            return;
         }
         finishReject(new Error('SSE network error'));
      };

      xhr.send();
   });
}
