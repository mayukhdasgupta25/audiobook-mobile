import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
   SubscriptionPlan,
   getPlanFeatureDescriptions,
} from '@/services/subscriptions';
import { formatPlanPrice } from '@/utils/format';

interface SubscriptionPlanCardProps {
   plan: SubscriptionPlan;
   isCurrentPlan?: boolean;
   actionLabel?: string;
   isActionDisabled?: boolean;
   onUpgradePress: (plan: SubscriptionPlan) => void;
}

/**
 * Card displaying a subscription plan with features and upgrade action
 */
export function SubscriptionPlanCard({
   plan,
   isCurrentPlan = false,
   actionLabel,
   isActionDisabled = false,
   onUpgradePress,
}: SubscriptionPlanCardProps) {
   const priceLabel =
      plan.billingInterval === 'MONTHLY'
         ? `${formatPlanPrice(plan.price, plan.currency)}/month`
         : formatPlanPrice(plan.price, plan.currency);

   const featureDescriptions = getPlanFeatureDescriptions(plan);
   const buttonLabel =
      actionLabel ?? (isCurrentPlan ? 'Current plan' : 'Upgrade Plan');
   const buttonDisabled = isCurrentPlan || isActionDisabled;

   return (
      <View style={[styles.card, isCurrentPlan && styles.cardCurrent]}>
         <Text style={styles.planName}>{plan.name}</Text>
         <Text style={styles.planDescription}>{plan.description}</Text>
         <Text style={styles.planPrice}>{priceLabel}</Text>

         {featureDescriptions.length > 0 ? (
            <View style={styles.featureList}>
               {featureDescriptions.map((feature, index) => (
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

         <TouchableOpacity
            style={[
               styles.upgradeButton,
               buttonDisabled && styles.upgradeButtonDisabled,
            ]}
            onPress={() => onUpgradePress(plan)}
            activeOpacity={0.7}
            disabled={buttonDisabled}
         >
            <Text style={styles.upgradeButtonText}>{buttonLabel}</Text>
         </TouchableOpacity>
      </View>
   );
}

const styles = StyleSheet.create({
   card: {
      backgroundColor: colors.background.darkGrayLight,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: 'transparent',
   },
   cardCurrent: {
      borderColor: colors.success,
   },
   planName: {
      fontSize: typography.fontSize.xl,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.xs,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   planDescription: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      marginBottom: spacing.sm,
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
   planPrice: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.md,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
   featureList: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
   },
   featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
   },
   featureText: {
      flex: 1,
      fontSize: typography.fontSize.base,
      color: colors.text.dark,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
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
   upgradeButton: {
      backgroundColor: colors.app.red,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
   },
   upgradeButtonDisabled: {
      backgroundColor: colors.background.darkGray,
      opacity: 0.7,
   },
   upgradeButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '600',
         },
         android: {
            fontFamily: 'sans-serif-medium',
         },
      }),
   },
});
