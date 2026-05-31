import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   SubscriptionPlan,
   getPlanFeatureDescriptions,
} from '@/services/subscriptions';
import { formatPlanPrice } from '@/utils/format';
import { SecondaryButton } from '@/components/SecondaryButton';

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
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         card: {
            backgroundColor: t.colors.background.darkGrayLight,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
         },
         cardCurrent: {
            backgroundColor: t.colors.background.highlight,
         },
         planName: {
            fontSize: typography.fontSize.xl,
            fontWeight: '600',
            color: t.colors.text.dark,
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
            color: t.colors.text.secondaryDark,
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
            color: t.colors.text.dark,
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
            color: t.colors.text.dark,
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
      })
   );

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

         <SecondaryButton
            title={buttonLabel}
            onPress={() => onUpgradePress(plan)}
            disabled={buttonDisabled}
         />
      </View>
   );
}
