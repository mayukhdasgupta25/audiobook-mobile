import React from 'react';
import {
   View,
   Text,
   Image,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { MembershipIndicator } from '@/components/profile/MembershipIndicator';
import { MembershipBadge } from '@/components/profile/MembershipBadge';
import type { MembershipTier } from '@/utils/membershipDisplay';

interface ProfileUserCardProps {
   displayName: string;
   email?: string;
   avatarUri?: string;
   tier: MembershipTier;
   planName?: string;
   onPress?: () => void;
}

function getInitials(name: string): string {
   const names = name.trim().split(' ');
   if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
   }
   return name.substring(0, 2).toUpperCase();
}

export const ProfileUserCard: React.FC<ProfileUserCardProps> = ({
   displayName,
   email,
   avatarUri,
   tier,
   planName,
   onPress,
}) => {
   const { colors } = useTheme();
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         container: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.colors.background.card,
            marginHorizontal: spacing.md,
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
         },
         avatarContainer: {
            marginRight: spacing.md,
         },
         avatar: {
            width: 64,
            height: 64,
            borderRadius: borderRadius.full,
         },
         avatarPlaceholder: {
            backgroundColor: t.colors.primary[200],
            justifyContent: 'center',
            alignItems: 'center',
         },
         avatarText: {
            fontSize: typography.fontSize.xl,
            color: t.colors.accent.primary,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         content: {
            flex: 1,
            minWidth: 0,
         },
         nameRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
         },
         name: {
            fontSize: typography.fontSize.lg,
            color: t.colors.text.primary,
            flexShrink: 1,
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '700' },
               android: { fontFamily: 'sans-serif-medium', fontWeight: '700' },
            }),
         },
         email: {
            fontSize: typography.fontSize.sm,
            color: t.colors.text.secondary,
            marginTop: 2,
         },
      })
   );

   return (
      <TouchableOpacity
         style={styles.container}
         onPress={onPress}
         activeOpacity={0.8}
         disabled={!onPress}
      >
         <View style={styles.avatarContainer}>
            {avatarUri ? (
               <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
               <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
               </View>
            )}
         </View>

         <View style={styles.content}>
            <View style={styles.nameRow}>
               <Text style={styles.name} numberOfLines={1}>
                  {displayName}
               </Text>
               <MembershipIndicator tier={tier} size={16} />
            </View>
            {email ? (
               <Text style={styles.email} numberOfLines={1}>
                  {email}
               </Text>
            ) : null}
            <MembershipBadge tier={tier} planName={planName} />
         </View>

         <Ionicons name="chevron-forward" size={20} color={colors.text.secondaryDark} />
      </TouchableOpacity>
   );
};
