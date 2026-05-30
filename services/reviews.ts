/**
 * Reviews (ratings) service
 */

import { post, ApiError, API_V1_PATH } from './api';

export interface CreateReviewRequest {
   audiobookId: string;
   rating: number;
}

export interface Review {
   id: string;
   audiobookId: string;
   rating: number;
   createdAt?: string;
   updatedAt?: string;
}

export interface ReviewResponse {
   success: boolean;
   data: Review;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
}

export async function createReview(
   request: CreateReviewRequest
): Promise<ReviewResponse> {
   try {
      const response = await post<ReviewResponse>(
         `${API_V1_PATH}/reviews`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
