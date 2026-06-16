/**
 * Organizations (Publishers) service
 */

import { get, ApiError, API_V1_PATH } from './api';
import { PaginationInfo, AudiobooksResponse } from './audiobooks';
import type { ImageAssetsMap } from '@/constants/imageVariants';
import { ORGANIZATION_IMAGE_SLOT_VARIANT } from '@/constants/imageVariants';
import { pickImageAssetPath, resolveOrganizationImageUrl } from '@/utils/imageAssets';

export interface Organization {
   id: string;
   name: string;
   slug: string;
   description?: string;
   image?: string | null;
   imageAssets?: ImageAssetsMap;
   preferredGenre?: string | null;
   websiteUrl?: string | null;
   teamSize?: string | null;
   memberCount?: number;
   createdAt?: string;
   updatedAt?: string;
}

export interface OrganizationsListResponse {
   message: string;
   organizations: Organization[];
   pagination?: PaginationInfo;
}

export interface OrganizationDetailResponse {
   message: string;
   organization: Organization;
}

export async function getOrganizations(): Promise<OrganizationsListResponse> {
   try {
      const response = await get<OrganizationsListResponse>(
         '/auth/organizations/all',
         true,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch organizations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export async function getOrganizationById(id: string): Promise<OrganizationDetailResponse> {
   try {
      const response = await get<OrganizationDetailResponse>(
         `/auth/catalog/organizations/${id}`,
         true,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch organization: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Audiobooks belonging to an organization (app-service)
 * GET /api/v1/organizations/{id}/audiobooks
 */
export async function getOrganizationAudiobooks(
   organizationId: string,
   page = 1
): Promise<AudiobooksResponse> {
   try {
      const response = await get<AudiobooksResponse>(
         `${API_V1_PATH}/organizations/${organizationId}/audiobooks?page=${page}`,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch organization audiobooks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

export function getOrganizationImageUri(org: Organization): string | undefined {
   return resolveOrganizationImageUrl(org, 'logo');
}

/** Returns relative path for route params when a full URI is not needed. */
export function getOrganizationImagePath(org: Organization): string | undefined {
   return pickImageAssetPath(
      org.image,
      org.imageAssets,
      ORGANIZATION_IMAGE_SLOT_VARIANT.logo
   );
}
