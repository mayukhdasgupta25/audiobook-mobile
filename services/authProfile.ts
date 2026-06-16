/**
 * Auth-service user profile API (demographic / account fields).
 * GET/PUT /auth/user/profile on port 8080.
 */

import { get, put, ApiError } from './api';
import type { ProfileLocationPayload } from './profileTypes';

export interface AuthUserProfile {
   id: string;
   email: string;
   role: string;
   emailVerified: boolean;
   firstName?: string;
   lastName?: string;
   address?: string;
   contact?: string;
   gender?: string;
   location?: string;
   age?: number;
   createdAt: string;
   updatedAt: string;
}

export interface AuthUserProfileResponse {
   user: AuthUserProfile;
}

export interface UpdateAuthProfileResponse {
   message: string;
   user: AuthUserProfile;
}

export interface UpdateAuthProfileRequest {
   firstName?: string;
   lastName?: string;
   address?: string | null;
   contact?: string | null;
   gender?: string | null;
   age?: number | null;
   location?: ProfileLocationPayload | null;
}

export async function getAuthUserProfile(): Promise<AuthUserProfileResponse> {
   try {
      const response = await get<AuthUserProfileResponse>(
         '/auth/user/profile',
         true,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[Auth Profile Service] Get profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Get auth profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function updateAuthUserProfile(
   profileData: UpdateAuthProfileRequest
): Promise<UpdateAuthProfileResponse> {
   try {
      const response = await put<UpdateAuthProfileResponse>(
         '/auth/user/profile',
         profileData,
         true,
         true
      );
      return response.data;
   } catch (error) {
      console.error('[Auth Profile Service] Update profile error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Update auth profile failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
