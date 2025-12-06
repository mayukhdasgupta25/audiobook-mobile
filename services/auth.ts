/**
 * Authentication service
 * Handles authentication API calls
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
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
      const response = await post<SignupResponse>('/auth/register', credentials, false, true);
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
 * Google OAuth request payload
 */
export interface GoogleAuthRequest {
   token: string;
}

/**
 * Google OAuth response from API (same structure as login)
 */
export interface GoogleAuthResponse {
   message: string;
   accessToken: string;
   refreshToken: string;
   user: User;
}

/**
 * Logout response from API
 */
export interface LogoutResponse {
   message: string;
}

/**
 * Initialize Google Sign-In configuration
 * Should be called once when the app starts
 */
export function configureGoogleSignIn(): void {
   // Get Google OAuth client IDs from environment variables
   const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
   const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

   if (!webClientId) {
      console.warn('[Auth Service] Google Sign-In web client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID environment variable.');
      return;
   }

   // Configure Google Sign-In
   GoogleSignin.configure({
      webClientId, // Required for getting the idToken on Android
      iosClientId, // Optional, for iOS
      offlineAccess: false, // If you want to access Google API on behalf of the user FROM YOUR SERVER
      forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
      scopes: ['profile', 'email'], // What API you want to access on behalf of the user,
   });
}

/**
 * Google OAuth function
 * Initiates Google Sign-In flow and sends token to server
 * @returns Promise with Google auth response containing accessToken, refreshToken, and user
 * @throws ApiError if Google auth fails
 */
export async function googleAuth(): Promise<GoogleAuthResponse> {
   try {
      // Ensure Google Sign-In is configured
      configureGoogleSignIn();

      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
         await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Check if sign-in was cancelled or failed
      if (!userInfo || !userInfo.data) {
         throw new Error('Google sign-in was cancelled or failed');
      }

      // Get the ID token
      const idToken = userInfo.data.idToken;
      if (!idToken) {
         throw new Error('Failed to retrieve Google ID token');
      }

      // Send token to server
      const response = await post<GoogleAuthResponse>(
         '/auth/google',
         { token: idToken },
         false,
         true
      );

      return response.data;
   } catch (error: unknown) {
      console.error('[Auth Service] Google auth error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });

      // Handle Google Sign-In specific errors
      if (error && typeof error === 'object' && 'code' in error) {
         const googleError = error as { code: string; message?: string };
         if (googleError.code === 'SIGN_IN_CANCELLED') {
            throw new Error('Google sign-in was cancelled');
         }
         if (googleError.code === 'IN_PROGRESS') {
            throw new Error('Google sign-in is already in progress');
         }
         if (googleError.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
            throw new Error('Google Play Services are not available. Please update Google Play Services.');
         }
      }

      if (error instanceof ApiError) {
         throw error;
      }

      // Re-throw user-friendly errors
      if (error instanceof Error) {
         throw error;
      }

      throw new Error(
         `Google authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
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

