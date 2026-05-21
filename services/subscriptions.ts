/**
 * Subscriptions service
 * Handles user subscription API calls
 */

import { get, ApiError, API_V1_PATH } from './api';
import { PaginationInfo } from './audiobooks';

/**
 * Plan features from subscription API
 */
export interface SubscriptionPlanFeatures {
   items: string[];
   multiDeviceSync?: boolean;
   offlineDownload?: boolean;
   audioBitrateKbps?: number;
   accessAllAudiobooks?: boolean;
}

/**
 * Subscription plan nested in user subscription
 */
export interface SubscriptionPlan {
   id: string;
   name: string;
   description: string;
   price: number;
   currency: string;
   tierLevel: number;
   billingInterval: string;
   trialDays: number;
   features: SubscriptionPlanFeatures;
   isActive: boolean;
   createdAt: string;
   updatedAt: string;
}

/**
 * User subscription record
 */
export interface UserSubscription {
   id: string;
   userProfileId: string;
   planId: string;
   status: string;
   startDate: string;
   endDate: string | null;
   currentPeriodStart: string;
   currentPeriodEnd: string | null;
   trialEndsAt: string | null;
   cancelAtPeriodEnd: boolean;
   canceledAt: string | null;
   autoRenew: boolean;
   paymentMethod: string | null;
   createdAt: string;
   updatedAt: string;
   plan: SubscriptionPlan;
}

/**
 * Subscription plans catalog API response
 */
export interface SubscriptionPlansResponse {
   success: boolean;
   data: SubscriptionPlan[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
   pagination: PaginationInfo;
}

/**
 * User subscriptions API response
 */
export interface UserSubscriptionsResponse {
   success: boolean;
   data: UserSubscription[];
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
   pagination: PaginationInfo;
}

/**
 * Pick the current active subscription from the list
 */
export function getActiveSubscription(
   subscriptions: UserSubscription[]
): UserSubscription | null {
   if (subscriptions.length === 0) {
      return null;
   }
   return subscriptions.find((s) => s.status === 'ACTIVE') ?? subscriptions[0] ?? null;
}

/**
 * Get subscriptions for a user profile
 * Calls GET /api/v1/subscriptions/user/:userProfileId with Bearer token
 */
export async function getUserSubscriptions(
   userProfileId: string
): Promise<UserSubscriptionsResponse> {
   try {
      const response = await get<UserSubscriptionsResponse>(
         `${API_V1_PATH}/subscriptions/user/${userProfileId}`,
         true
      );
      return response.data;
   } catch (error) {
      console.warn('[Subscriptions Service] Get user subscriptions error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         userProfileId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get available subscription plans catalog
 * Calls GET /api/v1/subscription-plans with Bearer token
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
   try {
      const response = await get<SubscriptionPlansResponse>(
         `${API_V1_PATH}/subscription-plans`,
         true
      );
      return response.data;
   } catch (error) {
      console.warn('[Subscriptions Service] Get subscription plans error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch subscription plans: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
