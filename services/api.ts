/**
 * API client configuration and utilities
 * Centralized API setup with error handling and request interceptors
 * 
 * AUTHENTICATION FLOW:
 * ===================
 * 1. User logs in via login API (POST /auth/login) → receives accessToken
 * 2. Token is stored in Redux store via setAuth() action (in store/auth.ts)
 * 3. All authenticated API calls should use useAuth=true parameter
 * 4. getAuthHeaders() automatically retrieves token from Redux store
 * 5. Token is sent as: Authorization: Bearer <accessToken>
 * 
 * USAGE:
 * ======
 * // Authenticated request (automatically adds Bearer token):
 * await get('/api/v1/audiobooks', true); // useAuth=true
 * 
 * // Unauthenticated request (no token):
 * await get('/api/v1/tags', false); // useAuth=false
 * 
 * All API helper functions (get, post, put, del) support useAuth parameter.
 * When useAuth=true, the Bearer token from Redux store is automatically included.
 */

import { Platform } from 'react-native';

/**
 * Get the auth API port (8080 for login/signup)
 */
function getAuthApiPort(): string {
   // If environment variable is set, use it
   if (process.env.EXPO_PUBLIC_AUTH_API_PORT) {
      return process.env.EXPO_PUBLIC_AUTH_API_PORT;
   }
   // Default to 8080 for auth endpoints
   return '8080';
}

/**
 * Get the main API port (8082 for all other APIs)
 */
function getMainApiPort(): string {
   // If environment variable is set, use it
   if (process.env.EXPO_PUBLIC_API_PORT) {
      return process.env.EXPO_PUBLIC_API_PORT;
   }
   // Default to 8082 for development
   return '8082';
}

/**
 * Extract host from a full URL or return the URL if it's already a full URL
 */
function extractHostFromUrl(url: string): string | null {
   try {
      // If URL already includes protocol, extract hostname
      if (url.startsWith('http://') || url.startsWith('https://')) {
         const urlObj = new URL(url);
         return urlObj.hostname;
      }
      // If it's just a hostname/IP, return it
      return url;
   } catch {
      return null;
   }
}

/**
 * Normalize URL - ensure it has protocol and port
 */
function normalizeUrl(url: string, defaultPort: string): string {
   // Fix double equals if present
   const normalized = url.replace(/^=+/, '');

   // If URL already includes protocol and port, return as is
   if (normalized.match(/^https?:\/\/[^:]+:\d+/)) {
      return normalized;
   }

   // If URL includes protocol but no port, add port
   if (normalized.match(/^https?:\/\//)) {
      return `${normalized}:${defaultPort}`;
   }

   // If URL is just hostname/IP, add protocol and port
   return `http://${normalized}:${defaultPort}`;
}

/**
 * Build API URL with specified port
 * - Web/iOS Simulator: localhost works
 * - Android Emulator: Use 10.0.2.2 (special IP that maps to host machine's localhost)
 * - Physical devices: Need actual IP address (set via EXPO_PUBLIC_API_URL or EXPO_PUBLIC_AUTH_API_URL)
 */
function buildApiUrl(port: string): string {
   // For auth API (port 8080), check EXPO_PUBLIC_AUTH_API_URL
   if (port === getAuthApiPort() && process.env.EXPO_PUBLIC_AUTH_API_URL) {
      return normalizeUrl(process.env.EXPO_PUBLIC_AUTH_API_URL, port);
   }

   // For main API (port 8082), check EXPO_PUBLIC_API_URL
   if (port === getMainApiPort() && process.env.EXPO_PUBLIC_API_URL) {
      const mainApiUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL, port);
      // Warn if the URL is using the wrong port (8080 or 8081 instead of 8082)
      if ((mainApiUrl.includes(':8080') || mainApiUrl.includes(':8081')) && !mainApiUrl.includes(':8082')) {
         console.warn(
            '[API Config Warning] EXPO_PUBLIC_API_URL is using port 8080 or 8081, but main API should use port 8082. Consider updating to port 8082.'
         );
      }
      return mainApiUrl;
   }

   // If auth API URL is set but main API URL is not, extract host from auth URL for main API
   // This helps when user only sets EXPO_PUBLIC_AUTH_API_URL on physical devices
   if (
      port === getMainApiPort() &&
      process.env.EXPO_PUBLIC_AUTH_API_URL &&
      !process.env.EXPO_PUBLIC_API_URL
   ) {
      const host = extractHostFromUrl(process.env.EXPO_PUBLIC_AUTH_API_URL);
      if (host) {
         return `http://${host}:${port}`;
      }
   }

   // Platform-specific defaults
   if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return `http://10.0.2.2:${port}`;
   }

   // iOS simulator and web can use localhost
   return `http://localhost:${port}`;
}

/**
 * Get auth API base URL (port 8080 for login/signup)
 */
export function getAuthApiUrl(): string {
   return buildApiUrl(getAuthApiPort());
}

/**
 * Get main API base URL (port 8082 for all other APIs)
 */
export function getMainApiUrl(): string {
   return buildApiUrl(getMainApiPort());
}

// Base API URL for main APIs - supports dynamic host via environment variables
const API_BASE_URL = getMainApiUrl();

// Auth API URL for authentication endpoints
export const AUTH_API_BASE_URL = getAuthApiUrl();

// Log API configuration on module load
console.log('[API Config]', {
   AUTH_API_BASE_URL,
   API_BASE_URL,
   Platform: Platform.OS,
   EXPO_PUBLIC_AUTH_API_URL: process.env.EXPO_PUBLIC_AUTH_API_URL,
   EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
   EXPO_PUBLIC_AUTH_API_PORT: process.env.EXPO_PUBLIC_AUTH_API_PORT,
   EXPO_PUBLIC_API_PORT: process.env.EXPO_PUBLIC_API_PORT,
   authPort: getAuthApiPort(),
   mainPort: getMainApiPort(),
   note: Platform.OS === 'android'
      ? 'Using 10.0.2.2 for Android emulator (maps to host localhost)'
      : Platform.OS === 'ios'
         ? 'Using localhost for iOS simulator'
         : 'Using localhost for web',
   warning: API_BASE_URL.includes(':8080') || API_BASE_URL.includes(':8081')
      ? 'WARNING: Main API URL is using port 8080 or 8081! Should be 8082.'
      : undefined,
});

/**
 * API client configuration
 */
export const apiConfig = {
   baseURL: API_BASE_URL,
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
   },
} as const;

/**
 * Get authentication headers with Bearer token
 * Retrieves accessToken from Redux store (set via login API)
 * All authenticated API calls should use this function via the useAuth parameter
 * 
 * @returns Headers object with Authorization header if token exists
 * @example
 * // Token is automatically added when useAuth=true:
 * await get('/api/v1/audiobooks', true); // Adds: Authorization: Bearer <token>
 */
export function getAuthHeaders(): Record<string, string> {
   // Import store dynamically to avoid circular dependencies
   // eslint-disable-next-line @typescript-eslint/no-require-imports
   const { store } = require('@/store');
   const state = store.getState();
   const accessToken = state.auth?.accessToken;

   // Validate and trim token to ensure proper format
   if (accessToken && typeof accessToken === 'string') {
      const trimmedToken = accessToken.trim();
      if (trimmedToken) {
         return {
            Authorization: `Bearer ${trimmedToken}`,
         };
      }
   }

   // Return empty object if no token (will result in 401 if endpoint requires auth)
   // This is expected behavior - the API will reject with proper error message
   return {};
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
   constructor(
      public status: number,
      public statusText: string,
      public data?: unknown
   ) {
      super(`API Error: ${status} ${statusText}`);
      this.name = 'ApiError';
   }
}

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
   data: T;
   status: number;
   statusText: string;
}

/**
 * Generic API request function with error handling
 * 
 * All authenticated API calls should set useAuth=true to automatically include
 * the Bearer token from Redux store (set via login API).
 * 
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @param useAuth - Whether to include Bearer token in headers (default: false)
 *                  When true, automatically adds: Authorization: Bearer <token>
 *                  Token is retrieved from Redux store (set via login API)
 * @param useAuthApi - Whether to use auth API URL (port 8080) instead of main API URL (port 8082) (default: false)
 *                     Set to true for login/signup endpoints only
 * 
 * @example
 * // Authenticated request (automatically adds Bearer token):
 * await apiRequest('/api/v1/audiobooks', { method: 'GET' }, true);
 * 
 * // Unauthenticated request (no token):
 * await apiRequest('/api/v1/tags', { method: 'GET' }, false);
 */
export async function apiRequest<T>(
   endpoint: string,
   options: RequestInit = {},
   useAuth = false,
   useAuthApi = false
): Promise<ApiResponse<T>> {
   // Use auth API URL for authentication endpoints, main API URL for others
   const baseURL = useAuthApi ? AUTH_API_BASE_URL : apiConfig.baseURL;
   const url = `${baseURL}${endpoint}`;

   // Debug log to verify correct URL is being used
   if (endpoint.includes('/audiobooks')) {
      console.log('[API Request Debug]', {
         endpoint,
         useAuthApi,
         baseURL,
         fullUrl: url,
         AUTH_API_BASE_URL,
         MAIN_API_BASE_URL: apiConfig.baseURL,
      });
   }

   // Get auth headers if needed
   const authHeaders = useAuth ? getAuthHeaders() : {};

   // If useAuth=true but no token is available, logout immediately and throw error
   if (useAuth && !authHeaders.Authorization) {
      console.warn('[API Request] useAuth=true but no access token found in store. Logging out user.');
      // Import store and error handler dynamically to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { store } = require('@/store');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { checkAndHandle401Error } = require('@/utils/apiErrorHandler');
      const state = store.getState();

      // Create a 401 error to trigger logout
      const apiError = new ApiError(401, 'Unauthorized', {
         message: 'Access token is missing',
         details: 'No access token available for authenticated request',
      });

      // Only logout if user was previously authenticated (to avoid logout loops during initialization)
      if (state.auth?.isAuthenticated || state.auth?.accessToken) {
         await checkAndHandle401Error(apiError, false);
      }

      // Still log the state for debugging
      console.warn('[API Request] Auth state:', {
         hasToken: !!state.auth?.accessToken,
         tokenType: typeof state.auth?.accessToken,
         tokenLength: state.auth?.accessToken?.length,
         isAuthenticated: state.auth?.isAuthenticated,
         isInitialized: state.auth?.isInitialized,
      });

      // Throw error to prevent the request from being made
      throw apiError;
   }

   // Merge headers: base config first, then auth headers, then custom headers
   // Note: options.headers can override auth headers, but this should be avoided
   // For M3U8 endpoints, use text/plain Accept header instead of application/json
   const defaultHeaders = endpoint.includes('.m3u8')
      ? { ...apiConfig.headers, Accept: 'text/plain' }
      : apiConfig.headers;

   const headers: Record<string, string> = {
      ...defaultHeaders,
      ...authHeaders,
      ...(options.headers as Record<string, string> | undefined),
   };

   // If useAuth=true and we have a token, ensure Authorization header is properly formatted
   if (useAuth && authHeaders.Authorization && headers.Authorization) {
      // Ensure the header is in the correct format: Bearer <token>
      if (!headers.Authorization.startsWith('Bearer ')) {
         console.warn('[API Request] Authorization header format is incorrect. Expected: Bearer <token>');
         // Fix the format if it's missing the Bearer prefix
         const token = headers.Authorization.replace(/^Bearer\s+/i, '').trim();
         headers.Authorization = `Bearer ${token}`;
      }
   }

   // Log request details (mask token for security)
   const logHeaders = { ...headers };
   if (logHeaders.Authorization) {
      const tokenPreview = logHeaders.Authorization.substring(0, 20) + '...';
      logHeaders.Authorization = tokenPreview;
   }

   console.log('[API Request]', {
      method: options.method || 'GET',
      url,
      body: options.body,
      headers: logHeaders,
      useAuth,
      hasAuthHeader: !!headers.Authorization,
      authHeaderFormat: headers.Authorization?.startsWith('Bearer ') ? 'correct' : 'incorrect',
   });

   try {
      const response = await fetch(url, {
         ...options,
         headers,
      });

      console.log('[Response]', response);

      console.log('[API Response]', {
         status: response.status,
         statusText: response.statusText,
         ok: response.ok,
         url: response.url,
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         console.error('[API Error]', {
            status: response.status,
            statusText: response.statusText,
            errorData,
         });
         const apiError = new ApiError(
            response.status,
            response.statusText,
            errorData
         );

         // Handle ALL 401 errors - logout user and redirect to signin
         // Skip 401 handling only for login/signup endpoints (useAuthApi=true)
         // This ensures any 401 response triggers logout, regardless of useAuth flag
         if (response.status === 401 && !useAuthApi) {
            // Import dynamically to avoid circular dependencies
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { checkAndHandle401Error } = require('@/utils/apiErrorHandler');
            // Check if user is authenticated before logging out (to avoid logout loops)
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { store } = require('@/store');
            const state = store.getState();
            // Only logout if user was previously authenticated
            if (state.auth?.isAuthenticated || state.auth?.accessToken) {
               await checkAndHandle401Error(apiError, false);
            }
         }

         throw apiError;
      }

      // Check content type to determine if response is JSON or text
      const contentType = response.headers.get('content-type') || '';
      let data: T;

      // Check if endpoint is M3U8 or content-type indicates text/plain
      const isM3U8Endpoint = endpoint.includes('.m3u8');
      const isTextContent =
         contentType.includes('text/plain') ||
         contentType.includes('application/vnd.apple.mpegurl') ||
         contentType.includes('text/');

      if (isM3U8Endpoint || isTextContent) {
         // Handle text/plain responses (e.g., M3U8 playlists)
         const textData = await response.text();
         data = textData as unknown as T;
      } else {
         // Handle JSON responses (default)
         // Get text first to check if it's actually JSON or M3U8
         const textData = await response.text();

         // Check if response starts with # (M3U8 format) - fallback detection
         if (textData.trim().startsWith('#')) {
            // It's M3U8 content, return as text
            data = textData as unknown as T;
         } else {
            // Try to parse as JSON
            try {
               data = JSON.parse(textData) as T;
            } catch {
               // If JSON parsing fails, return as text
               data = textData as unknown as T;
            }
         }
      }

      return {
         data,
         status: response.status,
         statusText: response.statusText,
      };
   } catch (error) {
      console.error('[API Request Error]', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         url,
      });

      if (error instanceof ApiError) {
         throw error;
      }
      // Network or other errors
      throw new Error(
         `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * GET request helper
 * @param endpoint - API endpoint path
 * @param useAuth - Whether to include Bearer token in headers (default: false)
 * @param useAuthApi - Whether to use auth API URL (port 8080) instead of main API URL (default: false)
 */
export async function get<T>(
   endpoint: string,
   useAuth = false,
   useAuthApi = false
): Promise<ApiResponse<T>> {
   return apiRequest<T>(
      endpoint,
      {
         method: 'GET',
      },
      useAuth,
      useAuthApi
   );
}

/**
 * POST request helper
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param useAuth - Whether to include Bearer token in headers (default: false)
 * @param useAuthApi - Whether to use auth API URL (port 8080) instead of main API URL (default: false)
 */
export async function post<T>(
   endpoint: string,
   body?: unknown,
   useAuth = false,
   useAuthApi = false
): Promise<ApiResponse<T>> {
   return apiRequest<T>(
      endpoint,
      {
         method: 'POST',
         body: body ? JSON.stringify(body) : undefined,
      },
      useAuth,
      useAuthApi
   );
}

/**
 * PUT request helper
 * @param endpoint - API endpoint path
 * @param body - Request body
 * @param useAuth - Whether to include Bearer token in headers (default: false)
 * @param useAuthApi - Whether to use auth API URL (port 8080) instead of main API URL (default: false)
 */
export async function put<T>(
   endpoint: string,
   body?: unknown,
   useAuth = false,
   useAuthApi = false
): Promise<ApiResponse<T>> {
   return apiRequest<T>(
      endpoint,
      {
         method: 'PUT',
         body: body ? JSON.stringify(body) : undefined,
      },
      useAuth,
      useAuthApi
   );
}

/**
 * DELETE request helper
 * @param endpoint - API endpoint path
 * @param useAuth - Whether to include Bearer token in headers (default: false)
 * @param useAuthApi - Whether to use auth API URL (port 8080) instead of main API URL (default: false)
 */
export async function del<T>(
   endpoint: string,
   useAuth = false,
   useAuthApi = false
): Promise<ApiResponse<T>> {
   return apiRequest<T>(
      endpoint,
      {
         method: 'DELETE',
      },
      useAuth,
      useAuthApi
   );
}

