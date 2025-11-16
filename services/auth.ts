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
   user: User;
}

/**
 * Login function
 * Calls POST /auth/login with email and password
 * @param credentials - Email and password
 * @returns Promise with login response containing accessToken and user
 * @throws ApiError if login fails
 */
export async function login(
   credentials: LoginRequest
): Promise<LoginResponse> {
   try {
      const response = await post<LoginResponse>('/auth/login', credentials);
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

