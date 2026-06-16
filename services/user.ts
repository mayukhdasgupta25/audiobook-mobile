/**
 * App-service user profile API (username, avatar, preferences).
 * GET/PUT /api/v1/user/profile on the main API port.
 */

import { get, put, ApiError } from './api';
import { API_V1_PATH } from './api';
import type { ImageAssetsMap } from '@/constants/imageVariants';
import {
   getAuthUserProfile,
   type AuthUserProfile,
} from './authProfile';
import type { UserPreferences } from './profileTypes';

export type { UserPreferences, ProfileLocationPayload, UserLocation } from './profileTypes';

/**
 * Merged profile used by Redux and UI — app fields plus auth demographic fields.
 */
export interface UserProfile {
   id: string;
   userId: string;
   username: string;
   avatar: string | null;
   imageAssets?: ImageAssetsMap;
   preferences: UserPreferences;
   createdAt: string;
   updatedAt: string;
   email: string;
   firstName: string | null;
   lastName: string | null;
   address: string | null;
   contact: string | null;
   age: number | null;
   gender: string | null;
   location: string | null;
}

/**
 * App-local profile fields from app-service.
 */
export interface AppUserProfile {
   id: string;
   userId: string;
   username: string;
   avatar: string | null;
   imageAssets?: ImageAssetsMap;
   preferences: UserPreferences;
   createdAt: string;
   updatedAt: string;
}

export interface AppUserProfileResponse {
   success: boolean;
   data: AppUserProfile;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export interface UpdateAppProfileRequest {
   username?: string;
   avatar?: string | null;
   preferences?: Pick<UserPreferences, 'favoriteGenreIds' | 'languages'>;
}

export function mergeUserProfiles(
   auth: AuthUserProfile,
   app: AppUserProfile
): UserProfile {
   return {
      id: app.id,
      userId: app.userId,
      username: app.username,
      avatar: app.avatar,
      imageAssets: app.imageAssets,
      preferences: app.preferences,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      email: auth.email,
      firstName: auth.firstName ?? null,
      lastName: auth.lastName ?? null,
      address: auth.address ?? null,
      contact: auth.contact ?? null,
      age: auth.age ?? null,
      gender: auth.gender ?? null,
      location: auth.location ?? null,
   };
}

export async function getAppUserProfile(): Promise<AppUserProfileResponse> {
   try {
      const response = await get<AppUserProfileResponse>(
         `${API_V1_PATH}/user/profile`,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[User Service] Get app profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Get app profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function updateAppUserProfile(
   profileData: UpdateAppProfileRequest
): Promise<AppUserProfileResponse> {
   try {
      const response = await put<AppUserProfileResponse>(
         `${API_V1_PATH}/user/profile`,
         profileData,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[User Service] Update app profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Update app profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Fetches auth and app profiles in parallel and merges into a single UserProfile.
 */
export async function fetchMergedUserProfile(): Promise<UserProfile> {
   const [authResponse, appResponse] = await Promise.all([
      getAuthUserProfile(),
      getAppUserProfile(),
   ]);

   if (!appResponse.data) {
      throw new Error('App user profile not found');
   }

   return mergeUserProfiles(authResponse.user, appResponse.data);
}

/** @deprecated Use fetchMergedUserProfile — kept for callers expecting wrapped response shape. */
export async function getUserProfile(): Promise<{ data: UserProfile }> {
   const data = await fetchMergedUserProfile();
   return { data };
}
