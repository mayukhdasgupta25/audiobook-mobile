/**
 * Subscriptions service
 * Handles user subscription API calls
 */

import { get, patch, ApiError, API_V1_PATH } from './api';
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
   pendingPlanId: string | null;
   pendingPlanChangeAt: string | null;
   pendingPlanChangeType: string | null;
   pastDueRetryCount: number;
   createdAt: string;
   updatedAt: string;
   plan: SubscriptionPlan;
   pendingPlan?: SubscriptionPlan | null;
}

/**
 * Request body for PATCH /api/v1/subscriptions/:id/plan
 */
export interface ChangePlanRequest {
   planId: string;
}

/**
 * Proration breakdown returned on immediate plan upgrades
 */
export interface ProrationBreakdown {
   remainingDays: number;
   periodDays: number;
   credit: number;
   newCost: number;
   immediateCharge: number;
   nextRenewalAmount: number;
   currency: string;
   trialEnded?: boolean;
}

/**
 * Scheduled downgrade applied at period end
 */
export interface ScheduledPlanChange {
   effectiveAt: string;
   pendingPlanId: string;
   pendingPlan?: SubscriptionPlan;
}

/**
 * Result payload from plan change (upgrade or scheduled downgrade)
 */
export interface ChangePlanResult {
   subscription: UserSubscription;
   proration?: ProrationBreakdown;
   scheduledChange?: ScheduledPlanChange;
}

/**
 * API response wrapper for plan change
 */
export interface ChangePlanResponse {
   success: boolean;
   data: ChangePlanResult;
   message: string;
   statusCode: number;
   timestamp: string;
   path: string;
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

/**
 * Change the subscription plan (upgrade immediately or schedule downgrade)
 * Calls PATCH /api/v1/subscriptions/:id/plan with Bearer token
 *
 * On upgrade: data includes proration breakdown and updated subscription.
 * On downgrade: data includes scheduledChange and subscription with pending plan fields.
 */
export async function changeSubscriptionPlan(
   subscriptionId: string,
   request: ChangePlanRequest
): Promise<ChangePlanResponse> {
   try {
      const response = await patch<ChangePlanResponse>(
         `${API_V1_PATH}/subscriptions/${subscriptionId}/plan`,
         request,
         true
      );
      return response.data;
   } catch (error) {
      console.warn('[Subscriptions Service] Change subscription plan error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         subscriptionId,
         planId: request.planId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to change subscription plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
