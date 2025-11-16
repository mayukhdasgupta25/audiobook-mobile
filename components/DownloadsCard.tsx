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

interface DownloadsCardProps {
   onPress?: () => void;
}

/**
 * Downloads card component
 * Displays a card that navigates to the downloads screen
 */
export const DownloadsCard: React.FC<DownloadsCardProps> = ({ onPress }) => {
   return (
      <TouchableOpacity
         style={styles.container}
         onPress={onPress}
         activeOpacity={0.8}
      >
         {/* Download icon */}
         <View style={styles.iconContainer}>
            <Ionicons
               name="arrow-down-circle"
               size={32}
               color={colors.text.dark}
            />
         </View>

         {/* Text content */}
         <View style={styles.textContainer}>
            <Text style={styles.title}>Downloads</Text>
            <Text style={styles.subtitle}>
               Stories that you downloaded appear here.
            </Text>
         </View>

         {/* Chevron arrow */}
         <View style={styles.chevronContainer}>
            <Ionicons
               name="chevron-forward"
               size={24}
               color={colors.text.secondaryDark}
            />
         </View>
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.darkGrayLight,
      marginHorizontal: spacing.md,
      marginVertical: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      minHeight: 100,
   },
   iconContainer: {
      marginRight: spacing.md,
   },
   textContainer: {
      flex: 1,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.dark,
      marginBottom: spacing.xs,
      letterSpacing: -0.2,
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
   subtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondaryDark,
      fontWeight: '400',
      lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
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
   chevronContainer: {
      marginLeft: spacing.sm,
   },
});

