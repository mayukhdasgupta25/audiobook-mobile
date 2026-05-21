import React, { useCallback } from 'react';
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
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { RootState } from '@/store';
import { ApiError } from '@/services/api';
import { SubscriptionPlan } from '@/services/subscriptions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { SubscriptionPlanCard } from '@/components/SubscriptionPlanCard';

/**
 * Subscription Plans screen — catalog of available plans with upgrade actions
 */
export default function SubscriptionPlansScreen() {
   const insets = useSafeAreaInsets();
   const userProfile = useSelector((state: RootState) => state.auth.userProfile);
   const userProfileId = userProfile?.id ?? '';

   const {
      plans,
      isLoading,
      error,
      refetch,
   } = useSubscriptionPlans();

   const { activeSubscription } = useUserSubscription(userProfileId);
   const currentPlanId = activeSubscription?.planId ?? activeSubscription?.plan?.id;

   const handleBackPress = () => {
      router.back();
   };

   const handleUpgradePress = useCallback((plan: SubscriptionPlan) => {
      Alert.alert('Upgrade Plan', `Upgrade to ${plan.name} — coming soon.`);
   }, []);

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
                        {error instanceof ApiError
                           ? (error.data as { message?: string } | undefined)?.message ??
                             'Failed to load subscription plans.'
                           : error instanceof Error
                             ? error.message
                             : 'Failed to load subscription plans.'}
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
