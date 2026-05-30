/**
 * Organizations (Publishers) service
 */

import { get, ApiError, API_V1_PATH } from './api';
import { PaginationInfo, AudiobooksResponse } from './audiobooks';

export interface Organization {
   id: string;
   name: string;
   description?: string;
   logo?: string;
   coverImage?: string;
   createdAt?: string;
   updatedAt?: string;
}

export interface OrganizationsResponse {
   success: boolean;
   data: Organization[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
   pagination?: PaginationInfo;
}

export interface OrganizationResponse {
   success: boolean;
   data: Organization;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export async function getOrganizations(): Promise<OrganizationsResponse> {
   try {
      const response = await get<OrganizationsResponse>(
         `${API_V1_PATH}/organizations/all`,
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

export async function getOrganizationById(id: string): Promise<OrganizationResponse> {
   try {
      const response = await get<OrganizationResponse>(
         `${API_V1_PATH}/organizations/${id}`,
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
 * Audiobooks belonging to an organization
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
