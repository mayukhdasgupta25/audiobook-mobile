import React, { useCallback, useMemo } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   Platform,
   ActivityIndicator,
   Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { SubscriptionPlan } from '@/services/subscriptions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useSubscriptionMutation } from '@/hooks/useSubscriptionMutation';
import { SubscriptionPlanCard } from '@/components/SubscriptionPlanCard';
import { formatPlanPrice } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function getPlanActionLabel(
   plan: SubscriptionPlan,
   currentPlanId: string | undefined,
   currentTierLevel: number | undefined,
   hasSubscription: boolean
): string {
   if (plan.id === currentPlanId) {
      return 'Current plan';
   }
   if (!hasSubscription) {
      return 'Subscribe';
   }
   if (currentTierLevel !== undefined) {
      if (plan.tierLevel > currentTierLevel) {
         return 'Upgrade';
      }
      if (plan.tierLevel < currentTierLevel) {
         return 'Downgrade';
      }
   }
   return 'Change plan';
}

/**
 * Subscription Plans screen — catalog of available plans with upgrade actions
 */
export default function SubscriptionPlansScreen() {
   const insets = useSafeAreaInsets();

   const {
      plans,
      isLoading,
      error,
      refetch,
   } = useSubscriptionPlans();

   const { activeSubscription } = useUserSubscription();
   const { mutateAsync, isPending } = useSubscriptionMutation();

   const currentPlanId = activeSubscription?.planId ?? activeSubscription?.plan?.id;
   const currentTierLevel = activeSubscription?.plan?.tierLevel;
   const hasSubscription = activeSubscription !== null;

   const handleBackPress = () => {
      router.back();
   };

   const handleUpgradePress = useCallback(
      (plan: SubscriptionPlan) => {
         if (plan.id === currentPlanId) {
            return;
         }

         const priceLabel =
            plan.billingInterval === 'MONTHLY'
               ? `${formatPlanPrice(plan.price, plan.currency)}/month`
               : formatPlanPrice(plan.price, plan.currency);

         const actionLabel = getPlanActionLabel(
            plan,
            currentPlanId,
            currentTierLevel,
            hasSubscription
         );

         Alert.alert(
            actionLabel === 'Subscribe' ? 'Subscribe' : `${actionLabel} plan`,
            `${actionLabel} to ${plan.name} (${priceLabel})?`,
            [
               { text: 'Cancel', style: 'cancel' },
               {
                  text: actionLabel,
                  onPress: async () => {
                     try {
                        const result = await mutateAsync({
                           planId: plan.id,
                           activeSubscription,
                        });
                        Alert.alert(
                           'Success',
                           result.message ||
                              `You are now on the ${plan.name} plan.`
                        );
                     } catch (err) {
                        Alert.alert(
                           'Error',
                           getApiErrorMessage(err, 'Failed to update subscription.')
                        );
                     }
                  },
               },
            ]
         );
      },
      [
         activeSubscription,
         currentPlanId,
         currentTierLevel,
         hasSubscription,
         mutateAsync,
      ]
   );

   const planActionLabels = useMemo(() => {
      const labels = new Map<string, string>();
      for (const plan of plans) {
         labels.set(
            plan.id,
            getPlanActionLabel(
               plan,
               currentPlanId,
               currentTierLevel,
               hasSubscription
            )
         );
      }
      return labels;
   }, [plans, currentPlanId, currentTierLevel, hasSubscription]);

   return (
      <>
         <Stack.Screen
            options={{
               headerShown: false,
               contentStyle: {
                  backgroundColor: colors.background.dark,
               },
            }}
         />
         <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
               <TouchableOpacity
                  onPress={handleBackPress}
                  style={styles.backButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
               >
                  <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
               </TouchableOpacity>
               <View style={styles.headerContent}>
                  <Text style={styles.title}>Subscription Plans</Text>
               </View>
            </View>

            <ScrollView
               style={styles.scrollView}
               contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: insets.bottom + spacing.xl },
               ]}
               showsVerticalScrollIndicator={false}
            >
               {isLoading ? (
                  <View style={styles.centered}>
                     <ActivityIndicator size="large" color={colors.app.red} />
                     <Text style={styles.statusText}>Loading plans...</Text>
                  </View>
               ) : error ? (
                  <View style={styles.centered}>
                     <Text style={styles.errorText}>
                        {getApiErrorMessage(
                           error,
                           'Failed to load subscription plans.'
                        )}
                     </Text>
                     <TouchableOpacity
                        onPress={() => refetch()}
                        style={styles.retryButton}
                        activeOpacity={0.7}
                     >
                        <Text style={styles.retryText}>Retry</Text>
                     </TouchableOpacity>
                  </View>
               ) : plans.length === 0 ? (
                  <View style={styles.centered}>
                     <Text style={styles.statusText}>No subscription plans available</Text>
                  </View>
               ) : (
                  <View style={styles.plansList}>
                     {plans.map((plan) => (
                        <SubscriptionPlanCard
                           key={plan.id}
                           plan={plan}
                           isCurrentPlan={plan.id === currentPlanId}
                           actionLabel={planActionLabels.get(plan.id)}
                           isActionDisabled={isPending}
                           onUpgradePress={handleUpgradePress}
                        />
                     ))}
                  </View>
               )}
            </ScrollView>
         </SafeAreaView>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background.dark,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
   },
   backButton: {
      marginRight: spacing.md,
      padding: spacing.xs,
   },
   headerContent: {
      flex: 1,
   },
   title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   scrollView: {
      flex: 1,
   },
   scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
   },
   plansList: {
      gap: spacing.lg,
   },
   centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.md,
   },
   statusText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondaryDark,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   errorText: {
      fontSize: typography.fontSize.base,
      color: colors.app.red,
      textAlign: 'center',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '400',
         },
         android: {
            fontFamily: 'sans-serif',
         },
      }),
   },
   retryButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
   },
   retryText: {
      fontSize: typography.fontSize.base,
      color: colors.primary[400],
      fontWeight: '500',
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '500',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
});
