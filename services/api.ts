/**
 * API client configuration and utilities
 * Centralized API setup with error handling and request interceptors
 */

import { Platform } from 'react-native';

/**
 * Get the default API base URL based on platform
 * - Web/iOS Simulator: localhost works
 * - Android Emulator: Use 10.0.2.2 (special IP that maps to host machine's localhost)
 * - Physical devices: Need actual IP address (set via EXPO_PUBLIC_API_URL)
 */
function getDefaultApiUrl(): string {
   // If environment variable is set, use it
   if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
   }

   // Platform-specific defaults
   if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:8080';
   }

   // iOS simulator and web can use localhost
   return 'http://localhost:8080';
}

// Base API URL - supports dynamic host via environment variables
const API_BASE_URL = getDefaultApiUrl();

// Log API configuration on module load
console.log('[API Config]', {
   API_BASE_URL,
   Platform: Platform.OS,
   EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
   hasEnvVar: !!process.env.EXPO_PUBLIC_API_URL,
   note: Platform.OS === 'android'
      ? 'Using 10.0.2.2 for Android emulator (maps to host localhost)'
      : Platform.OS === 'ios'
         ? 'Using localhost for iOS simulator'
         : 'Using localhost for web',
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
 */
export async function apiRequest<T>(
   endpoint: string,
   options: RequestInit = {}
): Promise<ApiResponse<T>> {
   const url = `${apiConfig.baseURL}${endpoint}`;

   console.log('[API Request]', {
      method: options.method || 'GET',
      url,
      body: options.body,
      headers: { ...apiConfig.headers, ...options.headers },
   });

   try {
      const response = await fetch(url, {
         ...options,
         headers: {
            ...apiConfig.headers,
            ...options.headers,
         },
      });

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
         throw new ApiError(
            response.status,
            response.statusText,
            errorData
         );
      }

      const data = (await response.json()) as T;

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
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
   return apiRequest<T>(endpoint, {
      method: 'GET',
   });
}

/**
 * POST request helper
 */
export async function post<T>(
   endpoint: string,
   body?: unknown
): Promise<ApiResponse<T>> {
   return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
   });
}

/**
 * PUT request helper
 */
export async function put<T>(
   endpoint: string,
   body?: unknown
): Promise<ApiResponse<T>> {
   return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
   });
}

/**
 * DELETE request helper
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
   return apiRequest<T>(endpoint, {
      method: 'DELETE',
   });
}

