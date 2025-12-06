/**
 * User profile service
 * Handles user profile API calls
 */

import { get, ApiError } from './api';
import { API_V1_PATH } from './api';

/**
 * User preferences interface
 */
export interface UserPreferences {
   theme: 'light' | 'dark';
   autoPlay: boolean;
   language: string;
   playbackSpeed: number;
}

/**
 * User profile interface matching API response
 */
export interface UserProfile {
   id: string;
   userId: string;
   username: string;
   firstName: string | null;
   lastName: string | null;
   avatar: string | null;
   preferences: UserPreferences;
   createdAt: string;
   updatedAt: string;
}

/**
 * User profile API response wrapper
 */
export interface UserProfileResponse {
   success: boolean;
   data: UserProfile;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

/**
 * Get user profile
 * Calls GET /api/v1/user/profile with authentication
 * @returns Promise with user profile response
 * @throws ApiError if profile fetch fails
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
   try {
      // Use authenticated API call (useAuth=true) to include Bearer token
      const response = await get<UserProfileResponse>(`${API_V1_PATH}/user/profile`, true);
      return response.data;
   } catch (error) {
      console.error('[User Service] Get profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Get profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

