import React from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface ScreenHeaderProps {
   title?: string;
   subtitle?: string;
   onBack?: () => void;
   rightActions?: React.ReactNode;
   showBack?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
   title,
   subtitle,
   onBack,
   rightActions,
   showBack = true,
}) => (
   <View style={styles.container}>
      <View style={styles.left}>
         {showBack && onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.7}>
               <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
         )}
         <View style={styles.titleBlock}>
            {title && (
               <Text style={styles.title} numberOfLines={1}>
                  {title}
               </Text>
            )}
            {subtitle && (
               <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
               </Text>
            )}
         </View>
      </View>
      {rightActions && <View style={styles.right}>{rightActions}</View>}
   </View>
);

const styles = StyleSheet.create({
   container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background.screen,
   },
   left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
   },
   iconButton: {
      marginRight: spacing.sm,
      padding: spacing.xs,
   },
   titleBlock: {
      flex: 1,
   },
   title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   subtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: 2,
   },
   right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
   },
});
