/**
 * Authentication service
 * Handles authentication API calls
 */

import { post, ApiError } from './api';

/**
 * User interface matching API response
 */
export interface User {
   id: string;
   email: string;
   role: string;
   emailVerified: boolean;
}

/**
 * Login request payload
 */
export interface LoginRequest {
   email: string;
   password: string;
}

/**
 * Login response from API
 */
export interface LoginResponse {
   message: string;
   accessToken: string;
   refreshToken: string;
   user: User;
}

/**
 * Signup request payload
 */
export interface SignupRequest {
   email: string;
   password: string;
}

/**
 * Signup response from API (same structure as login)
 */
export interface SignupResponse {
   message: string;
   accessToken: string;
   refreshToken: string;
   user: User;
}

/**
 * Login function
 * Calls POST /auth/login with email and password
 * @param credentials - Email and password
 * @returns Promise with login response containing accessToken, refreshToken, and user
 * @throws ApiError if login fails
 */
export async function login(
   credentials: LoginRequest
): Promise<LoginResponse> {
   try {
      // Use auth API (port 8080) for login endpoint
      const response = await post<LoginResponse>('/auth/login', credentials, false, true);
      return response.data;
   } catch (error) {
      console.error('[Auth Service] Login error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Signup function
 * Calls POST /auth/signup with email and password
 * @param credentials - Email and password
 * @returns Promise with signup response containing accessToken, refreshToken, and user
 * @throws ApiError if signup fails
 */
export async function signup(
   credentials: SignupRequest
): Promise<SignupResponse> {
   try {
      // Use auth API (port 8080) for signup endpoint
      const response = await post<SignupResponse>('/auth/signup', credentials, false, true);
      return response.data;
   } catch (error) {
      console.error('[Auth Service] Signup error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Logout request payload
 */
export interface LogoutRequest {
   refreshToken: string;
}

/**
 * Logout response from API
 */
export interface LogoutResponse {
   message: string;
}

/**
 * Logout function
 * Calls POST /auth/logout with refreshToken
 * @param refreshToken - Refresh token to invalidate on server
 * @returns Promise with logout response
 * @throws ApiError if logout fails
 */
export async function logout(
   refreshToken: string
): Promise<LogoutResponse> {
   try {
      // Use auth API (port 8080) for logout endpoint
      // Do NOT include Bearer token (useAuth=false)
      const response = await post<LogoutResponse>(
         '/auth/logout',
         { refreshToken },
         false,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[Auth Service] Logout error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

