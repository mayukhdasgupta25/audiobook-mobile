import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   SubscriptionPlan,
   getPlanFeatureDescriptions,
} from '@/services/subscriptions';
import { formatPlanPrice } from '@/utils/format';
import {
   getMembershipCrownColor,
   resolveMembershipTier,
} from '@/utils/membershipDisplay';
import { SecondaryButton } from '@/components/SecondaryButton';

interface SubscriptionPlanCardProps {
   plan: SubscriptionPlan;
   allPlans?: SubscriptionPlan[];
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
   allPlans,
   isCurrentPlan = false,
   actionLabel,
   isActionDisabled = false,
   onUpgradePress,
}: SubscriptionPlanCardProps) {
   const { colors } = useTheme();
   const membershipTier = resolveMembershipTier(plan, allPlans);
   const crownColor =
      getMembershipCrownColor(membershipTier) ?? colors.iconForegrounds.yellow;
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
         planNameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs,
         },
         planName: {
            flex: 1,
            fontSize: typography.fontSize.xl,
            fontWeight: '600',
            color: t.colors.text.dark,
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
      actionLabel ?? (isCurrentPlan ? 'Current plan' : 'Subscribe');
   const buttonDisabled = isCurrentPlan || isActionDisabled;

   return (
      <View style={[styles.card, isCurrentPlan && styles.cardCurrent]}>
         <View style={styles.planNameRow}>
            <MaterialCommunityIcons name="crown" size={22} color={crownColor} />
            <Text style={styles.planName}>{plan.name}</Text>
         </View>
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
            variant="outlined"
         />
      </View>
   );
}
