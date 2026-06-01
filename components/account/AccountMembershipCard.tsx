import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { SkeletonMembershipCard } from '@/components/skeleton';
import { SecondaryButton } from '@/components/SecondaryButton';
import {
   getPlanFeatureDescriptions,
   type UserSubscription,
} from '@/services/subscriptions';
import { formatAccountDate, formatPlanPrice } from '@/utils/format';
import {
   getMembershipCrownColor,
   resolveMembershipTier,
} from '@/utils/membershipDisplay';

interface AccountMembershipCardProps {
   memberSince: string;
   subscription: UserSubscription | null;
   isLoading: boolean;
   error: Error | null;
   onManagePlanPress: () => void;
   onRetryPress?: () => void;
}

export function AccountMembershipCard({
   memberSince,
   subscription,
   isLoading,
   error,
   onManagePlanPress,
   onRetryPress,
}: AccountMembershipCardProps) {
   const { colors } = useTheme();
   const plan = subscription?.plan;
   const membershipTier = resolveMembershipTier(plan);
   const crownColor =
      getMembershipCrownColor(membershipTier) ?? colors.iconForegrounds.yellow;

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         content: {
            padding: spacing.md,
         },
         memberSinceBadge: {
            alignSelf: 'flex-start',
            backgroundColor: t.colors.background.highlight,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            marginBottom: spacing.md,
         },
         memberSinceText: {
            fontSize: typography.fontSize.sm,
            fontWeight: '600',
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         emptyText: {
            fontSize: typography.fontSize.base,
            color: t.colors.text.secondary,
            marginBottom: spacing.md,
         },
         errorText: {
            fontSize: typography.fontSize.base,
            color: t.colors.error,
            marginBottom: spacing.sm,
         },
         retryText: {
            fontSize: typography.fontSize.base,
            color: t.colors.accent.primary,
            fontWeight: '500',
         },
         planHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm,
         },
         planName: {
            flex: 1,
            fontSize: typography.fontSize.lg,
            color: t.colors.text.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '600' },
            }),
         },
         statusBadge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            backgroundColor: t.colors.background.highlight,
         },
         statusBadgeActive: {
            backgroundColor: t.colors.success,
         },
         statusBadgeText: {
            fontSize: typography.fontSize.xs,
            fontWeight: '600',
            color: t.colors.text.primary,
            textTransform: 'capitalize',
         },
         detailText: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginBottom: spacing.xs,
         },
         featureList: {
            marginTop: spacing.sm,
            marginBottom: spacing.md,
            gap: spacing.sm,
         },
         featureItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
         },
         featureText: {
            flex: 1,
            fontSize: typography.fontSize.sm,
            color: t.colors.text.primary,
            lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
         },
         manageButton: {
            marginTop: spacing.xs,
         },
      })
   );

   return (
      <View style={styles.content}>
         <View style={styles.memberSinceBadge}>
            <Text style={styles.memberSinceText}>Member since {memberSince}</Text>
         </View>

         {isLoading ? (
            <SkeletonMembershipCard />
         ) : error ? (
            <>
               <Text style={styles.errorText}>
                  Unable to load membership details. Please try again.
               </Text>
               {onRetryPress ? (
                  <TouchableOpacity onPress={onRetryPress} activeOpacity={0.7}>
                     <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
               ) : null}
            </>
         ) : !subscription || !plan ? (
            <>
               <Text style={styles.emptyText}>No active membership</Text>
               <SecondaryButton
                  title="View plans"
                  onPress={onManagePlanPress}
                  variant="outlined"
               />
            </>
         ) : (
            <>
               <View style={styles.planHeader}>
                  <MaterialCommunityIcons name="crown" size={22} color={crownColor} />
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View
                     style={[
                        styles.statusBadge,
                        subscription.status === 'ACTIVE' && styles.statusBadgeActive,
                     ]}
                  >
                     <Text style={styles.statusBadgeText}>{subscription.status}</Text>
                  </View>
               </View>

               <Text style={styles.detailText}>
                  {formatPlanPrice(plan.price, plan.currency)}
                  {plan.billingInterval === 'MONTHLY' ? '/month' : ''}
               </Text>

               <Text style={styles.detailText}>
                  Billing period: {formatAccountDate(subscription.currentPeriodStart)}
                  {subscription.currentPeriodEnd
                     ? ` – ${formatAccountDate(subscription.currentPeriodEnd)}`
                     : ''}
               </Text>

               {subscription.currentPeriodEnd ? (
                  <Text style={styles.detailText}>
                     Next payment: {formatAccountDate(subscription.currentPeriodEnd)}
                  </Text>
               ) : null}

               {getPlanFeatureDescriptions(plan).length > 0 ? (
                  <View style={styles.featureList}>
                     {getPlanFeatureDescriptions(plan).map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                           <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={colors.success}
                           />
                           <Text style={styles.featureText}>{feature}</Text>
                        </View>
                     ))}
                  </View>
               ) : null}

               <View style={styles.manageButton}>
                  <SecondaryButton
                     title="Manage plan"
                     onPress={onManagePlanPress}
                     variant="outlined"
                  />
               </View>
            </>
         )}
      </View>
   );
}
