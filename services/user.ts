/**
 * User profile service
 * Handles user profile API calls
 */

import { get, put, ApiError } from './api';
import { API_V1_PATH } from './api';

/**
 * User preferences interface
 */
export interface UserPreferences {
   theme: 'light' | 'dark';
   autoPlay: boolean;
   language: string;
   playbackSpeed: number;
   favoriteGenreIds?: string[];
   languages?: string[];
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
   age: number | null;
   gender: string | null;
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

/**
 * Geographic location attached to the user profile
 */
export interface UserLocation {
   latitude: number;
   longitude: number;
   accuracy?: number | null;
   altitude?: number | null;
   /** ISO-8601 timestamp when the reading was taken */
   timestamp?: string;
}

/**
 * Update user profile request payload
 */
export interface UpdateProfileRequest {
   firstName?: string | null;
   lastName?: string | null;
   avatar?: string | null;
   location?: UserLocation;
   age?: number;
   gender?: string;
   preferences?: Pick<UserPreferences, 'favoriteGenreIds' | 'languages'>;
}

/**
 * Update user profile
 * Calls PUT /api/v1/user/profile with authentication
 * @param profileData - Profile data to update (firstName, lastName, avatar)
 * @returns Promise with updated user profile response
 * @throws ApiError if profile update fails
 */
export async function updateUserProfile(
   profileData: UpdateProfileRequest
): Promise<UserProfileResponse> {
   try {
      // Use authenticated API call (useAuth=true) to include Bearer token
      const response = await put<UserProfileResponse>(
         `${API_V1_PATH}/user/profile`,
         profileData,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[User Service] Update profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Update profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

