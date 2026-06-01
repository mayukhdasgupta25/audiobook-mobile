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
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { SubscriptionPlan } from '@/services/subscriptions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useSubscriptionMutation } from '@/hooks/useSubscriptionMutation';
import { SubscriptionPlanCard } from '@/components/SubscriptionPlanCard';
import { formatPlanPrice } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function getPlanActionLabel(
   plan: SubscriptionPlan,
   currentPlanId: string | undefined
): string {
   if (plan.id === currentPlanId) {
      return 'Current plan';
   }
   return 'Subscribe';
}

/**
 * Subscription Plans screen — catalog of available plans with upgrade actions
 */
export default function SubscriptionPlansScreen() {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: t.colors.background.dark,
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
      color: t.colors.text.secondaryDark,
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
      color: t.colors.app.red,
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
      color: t.colors.primary[400],
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
      })
   );

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

         Alert.alert(
            'Subscribe',
            `Subscribe to ${plan.name} (${priceLabel})?`,
            [
               { text: 'Cancel', style: 'cancel' },
               {
                  text: 'Subscribe',
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
      [activeSubscription, currentPlanId, mutateAsync]
   );

   const planActionLabels = useMemo(() => {
      const labels = new Map<string, string>();
      for (const plan of plans) {
         labels.set(plan.id, getPlanActionLabel(plan, currentPlanId));
      }
      return labels;
   }, [plans, currentPlanId]);

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
            <ScreenHeader
               headerIcon="subscription-plans"
               onBack={handleBackPress}
               titleSize="large"
               tone="onDark"
            />

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
                           allPlans={plans}
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

