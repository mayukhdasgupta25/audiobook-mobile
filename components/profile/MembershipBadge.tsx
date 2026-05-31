import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
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
   const isPaid = hasPaidMembership(tier);
   const label = getMembershipLabel(tier, planName);

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

const styles = StyleSheet.create({
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
      backgroundColor: colors.membership.badgeBg,
   },
   badgeNone: {
      backgroundColor: colors.membership.noneBadgeBg,
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
      color: colors.membership.badgeText,
   },
   textNone: {
      color: colors.membership.noneBadgeText,
   },
});
