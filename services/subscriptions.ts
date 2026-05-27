/**
 * Subscriptions service
 * Handles user subscription API calls (auth API)
 */

import { get, post, ApiError } from './api';
import { PaginationInfo } from './audiobooks';

export type AudioQuality = 'base' | 'high' | 'best';

export type AudiobookCatalog = 'selected' | 'curated_wide' | 'all';

/**
 * Plan features from subscription API
 */
export interface SubscriptionPlanFeatures {
   maxDevices: number;
   audioQuality: AudioQuality;
   audiobookCatalog: AudiobookCatalog;
   deviceChangesPerMonth: number;
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
   featureDescriptions: string[];
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
   message: string;
   plans: SubscriptionPlan[];
   pagination: PaginationInfo;
}

/**
 * Current user's subscription API response
 */
export interface MySubscriptionResponse {
   message: string;
   subscription: UserSubscription | null;
}

/**
 * Create subscription request body
 */
export interface CreateSubscriptionRequest {
   planId: string;
   autoRenew?: boolean;
   paymentMethod?: string;
   startDate?: string;
   startTrial?: boolean;
}

/**
 * Change plan request body
 */
export interface ChangePlanRequest {
   planId: string;
}

/**
 * Create or change-plan API response
 */
export interface SubscriptionMutationResponse {
   message: string;
   subscription: UserSubscription;
}

/**
 * Human-readable feature bullets for a plan
 */
export function getPlanFeatureDescriptions(plan: SubscriptionPlan): string[] {
   if (plan.featureDescriptions.length > 0) {
      return plan.featureDescriptions;
   }
   return [];
}

/**
 * Get the current user's active subscription
 * Calls GET /auth/subscriptions/me with Bearer token
 */
export async function getMySubscription(): Promise<MySubscriptionResponse> {
   try {
      const response = await get<MySubscriptionResponse>(
         '/auth/subscriptions/me',
         true,
         true
      );
      return response.data;
   } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
         return { message: 'No active subscription', subscription: null };
      }
      console.warn('[Subscriptions Service] Get my subscription error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to fetch subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Get available subscription plans catalog
 * Calls GET /auth/subscription-plans with Bearer token
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
   try {
      const response = await get<SubscriptionPlansResponse>(
         '/auth/subscription-plans',
         true,
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
 * Create a subscription for the current user
 * Calls POST /auth/subscriptions with Bearer token
 */
export async function createSubscription(
   body: CreateSubscriptionRequest
): Promise<SubscriptionMutationResponse> {
   try {
      const response = await post<SubscriptionMutationResponse>(
         '/auth/subscriptions',
         body,
         true,
         true
      );
      return response.data;
   } catch (error) {
      console.warn('[Subscriptions Service] Create subscription error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}

/**
 * Change the plan on an existing subscription (upgrade/downgrade)
 * Calls POST /auth/subscriptions/:id/change-plan with Bearer token
 */
export async function changeSubscriptionPlan(
   subscriptionId: string,
   body: ChangePlanRequest
): Promise<SubscriptionMutationResponse> {
   try {
      const response = await post<SubscriptionMutationResponse>(
         `/auth/subscriptions/${subscriptionId}/change-plan`,
         body,
         true,
         true
      );
      return response.data;
   } catch (error) {
      console.warn('[Subscriptions Service] Change subscription plan error', {
         error,
         errorType: error instanceof Error ? error.constructor.name : typeof error,
         errorMessage: error instanceof Error ? error.message : String(error),
         subscriptionId,
      });
      if (error instanceof ApiError) {
         throw error;
      }
      throw new Error(
         `Failed to change subscription plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
   }
}
