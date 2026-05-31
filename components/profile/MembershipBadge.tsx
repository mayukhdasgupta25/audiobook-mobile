import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
   getMembershipLabel,
   hasPaidMembership,
   type MembershipTier,
} from '@/utils/membershipDisplay';

interface MembershipBadgeProps {
   tier: MembershipTier;
   planName?: string;
}

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({ tier, planName }) => {
   const { colors } = useTheme();
   const isPaid = hasPaidMembership(tier);
   const label = getMembershipLabel(tier, planName);

   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         badge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            marginTop: spacing.xs,
         },
         badgePaid: {
            backgroundColor: t.colors.membership.badgeBg,
         },
         badgeNone: {
            backgroundColor: t.colors.membership.noneBadgeBg,
         },
         starIcon: {
            marginRight: 4,
         },
         text: {
            fontSize: typography.fontSize.sm,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '500' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         textPaid: {
            color: t.colors.membership.badgeText,
         },
         textNone: {
            color: t.colors.membership.noneBadgeText,
         },
      })
   );

   return (
      <View
         style={[
            styles.badge,
            isPaid ? styles.badgePaid : styles.badgeNone,
         ]}
      >
         {isPaid ? (
            <Ionicons
               name="star"
               size={12}
               color={colors.membership.badgeText}
               style={styles.starIcon}
            />
         ) : null}
         <Text style={[styles.text, isPaid ? styles.textPaid : styles.textNone]}>
            {label}
         </Text>
      </View>
   );
};
