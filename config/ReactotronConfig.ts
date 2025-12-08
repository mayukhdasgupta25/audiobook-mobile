/**
 * Reactotron Configuration
 * Development tool for monitoring Redux store, API calls, and React Query
 * Only active in development mode
 */

import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
// Note: reactotronReactQuery requires QueryClient, so we'll configure it in app/_layout.tsx
// import { reactotronReactQuery } from 'reactotron-react-query';

// Configure Reactotron instance
let reactotron: ReturnType<typeof Reactotron.configure> | null = null;

// Only configure Reactotron in development mode
if (__DEV__) {
   reactotron = Reactotron.configure({
      // Connection settings - default to localhost:9090
      host: 'localhost',
      port: 9090,
      // Name shown in Reactotron UI
      name: 'AudioBook Mobile',
   })
      // Add Redux plugin for state monitoring
      .use(reactotronRedux())
      // Note: React Query plugin requires QueryClient, so we'll add it in app/_layout.tsx
      // where we have access to the QueryClient instance
      // Connect to Reactotron desktop app
      .connect();

   // Clear Reactotron on app reload in development (if method exists)
   // Note: clear() may require an argument in some versions, so we skip it
   // The Reactotron UI will handle clearing on its own
}

// Export configured Reactotron instance or no-op object
// Use type assertion to handle the no-op case
export default (reactotron as typeof Reactotron | null) ||
   ({
      log: () => { },
      warn: () => { },
      error: () => { },
      display: () => { },
      image: () => { },
      clear: () => { },
      logImportant: () => { },
      send: () => { },
      createEnhancer: () => undefined,
   } as unknown as typeof Reactotron);

