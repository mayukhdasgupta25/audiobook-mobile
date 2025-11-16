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
import { colors, spacing, typography, borderRadius } from '@/theme';

interface ProfileHeaderProps {
   userName: string;
   avatarUri?: string;
   onAvatarPress?: () => void;
   onCastPress?: () => void;
   onSearchPress?: () => void;
   onMenuPress?: () => void;
}

/**
 * Profile header component with avatar, name, and action icons
 * Similar to Netflix's "My Netflix" header
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
   userName,
   avatarUri,
   onAvatarPress,
   onCastPress,
   onSearchPress,
   onMenuPress,
}) => {
   // Get user initials for placeholder
   const getInitials = (name: string): string => {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
         return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
   };

   return (
      <View style={styles.container}>
         {/* Left side: Avatar and Name */}
         <TouchableOpacity
            style={styles.userSection}
            onPress={onAvatarPress}
            activeOpacity={0.7}
         >
            <View style={styles.avatarContainer}>
               {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
               ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                     <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                  </View>
               )}
            </View>
            <View style={styles.nameContainer}>
               <Text style={styles.userName}>{userName}</Text>
               <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.text.dark}
                  style={styles.chevron}
               />
            </View>
         </TouchableOpacity>

         {/* Right side: Action icons */}
         <View style={styles.actionsContainer}>
            <TouchableOpacity
               onPress={onCastPress}
               style={styles.iconButton}
               activeOpacity={0.7}
            >
               <Ionicons name="tv-outline" size={24} color={colors.text.dark} />
            </TouchableOpacity>

            <TouchableOpacity
               onPress={onSearchPress}
               style={styles.iconButton}
               activeOpacity={0.7}
            >
               <Ionicons name="search-outline" size={24} color={colors.text.dark} />
            </TouchableOpacity>

            <TouchableOpacity
               onPress={onMenuPress}
               style={styles.iconButton}
               activeOpacity={0.7}
            >
               <Ionicons name="menu-outline" size={24} color={colors.text.dark} />
            </TouchableOpacity>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.background.dark,
   },
   userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
   },
   avatarContainer: {
      marginRight: spacing.sm,
   },
   avatar: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.full,
   },
   avatarPlaceholder: {
      backgroundColor: colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
   },
   avatarText: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '700',
      color: colors.text.dark,
      ...Platform.select({
         ios: {
            fontFamily: 'System',
            fontWeight: '700',
         },
         android: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
         },
      }),
   },
   nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   userName: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: '600',
      color: colors.text.dark,
      letterSpacing: -0.3,
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
   chevron: {
      marginLeft: spacing.xs,
   },
   actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   iconButton: {
      marginLeft: spacing.md,
      padding: spacing.xs,
   },
});

