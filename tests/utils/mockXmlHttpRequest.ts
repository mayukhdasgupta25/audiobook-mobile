type MockXhr = {
   open: jest.Mock;
   setRequestHeader: jest.Mock;
   send: jest.Mock;
   abort: jest.Mock;
   readyState: number;
   status: number;
   responseText: string;
   onreadystatechange: (() => void) | null;
   onprogress: (() => void) | null;
   onerror: (() => void) | null;
};

export function createMockXmlHttpRequest(): {
   xhr: MockXhr;
   install: () => void;
   restore: () => void;
} {
   const xhr: MockXhr = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      abort: jest.fn(),
      readyState: 0,
      status: 200,
      responseText: '',
      onreadystatechange: null,
      onprogress: null,
      onerror: null,
   };

   class MockXMLHttpRequest {
      static readonly UNSENT = 0;
      static readonly OPENED = 1;
      static readonly HEADERS_RECEIVED = 2;
      static readonly LOADING = 3;
      static readonly DONE = 4;

      constructor() {
         return xhr as unknown as MockXMLHttpRequest;
      }
   }

   const previous = global.XMLHttpRequest;

   return {
      xhr,
      install: () => {
         global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
      },
      restore: () => {
         global.XMLHttpRequest = previous;
      },
   };
}

export type { MockXhr };
