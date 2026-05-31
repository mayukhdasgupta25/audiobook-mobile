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
import {
   getMembershipCrownColor,
   getMembershipLabel,
   type MembershipTier,
} from '@/utils/membershipDisplay';

type MembershipBannerVariant = 'profile' | 'drawer';

interface MembershipBannerProps {
   tier: MembershipTier;
   planName?: string;
   variant?: MembershipBannerVariant;
   onManagePlanPress?: () => void;
   onUpgradePress?: () => void;
   onPress?: () => void;
}

export const MembershipBanner: React.FC<MembershipBannerProps> = ({
   tier,
   planName,
   variant = 'profile',
   onManagePlanPress,
   onUpgradePress,
   onPress,
}) => {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.membership.bannerBg,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginHorizontal: spacing.md,
            marginBottom: spacing.lg,
         },
         containerDrawer: {
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
         },
         iconCircle: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.full,
            backgroundColor: t.colors.background.screen,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
         },
         textBlock: {
            flex: 1,
            marginRight: spacing.sm,
         },
         title: {
            fontSize: typography.fontSize.lg,
            color: t.colors.membership.bannerText,
            marginBottom: spacing.xs,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         description: {
            fontSize: typography.fontSize.sm,
            color: t.colors.membership.bannerText,
            lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '400' },
               android: { fontFamily: 'sans-serif' },
            }),
         },
         manageButton: {
            backgroundColor: t.colors.accent.primaryDark,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
         },
         manageButtonText: {
            color: t.colors.background.screen,
            fontSize: typography.fontSize.sm,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
      })
   );

   const isDrawer = variant === 'drawer';
   const isPremium = tier === 'premium';
   const isPaid = tier !== 'none';
   const crownColor = getMembershipCrownColor(tier) ?? colors.iconForegrounds.yellow;

   const title = isPremium
      ? "You're Premium!"
      : isPaid
         ? getMembershipLabel(tier, planName)
         : 'Unlock Premium Access';

   const description = isPremium
      ? 'Thank you for being a Premium member. Enjoy unlimited access to all stories.'
      : isPaid
         ? 'Manage your subscription and explore upgrade options.'
         : 'Subscribe to unlock unlimited audiobooks and premium features.';

   const handlePrimaryPress = () => {
      if (isPremium || isPaid) {
         onManagePlanPress?.();
      } else {
         onUpgradePress?.();
      }
   };

   const content = (
      <View style={[styles.container, isDrawer && styles.containerDrawer]}>
         <View style={styles.iconCircle}>
            {isPaid ? (
               <MaterialCommunityIcons name="crown" size={isDrawer ? 22 : 28} color={crownColor} />
            ) : (
               <Ionicons
                  name="ribbon-outline"
                  size={isDrawer ? 22 : 28}
                  color={colors.iconForegrounds.muted}
               />
            )}
         </View>

         <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
         </View>

         {isDrawer ? (
            <Ionicons name="chevron-forward" size={20} color={colors.membership.bannerText} />
         ) : (
            <TouchableOpacity
               style={styles.manageButton}
               onPress={handlePrimaryPress}
               activeOpacity={0.8}
            >
               <Text style={styles.manageButtonText}>
                  {isPaid ? 'Manage Plan' : 'Upgrade'}
               </Text>
            </TouchableOpacity>
         )}
      </View>
   );

   if (isDrawer && onPress) {
      return (
         <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            {content}
         </TouchableOpacity>
      );
   }

   return content;
};
