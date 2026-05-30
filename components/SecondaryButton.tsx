import React from 'react';
import {
   TouchableOpacity,
   Text,
   StyleSheet,
   ActivityIndicator,
   Platform,
   View,
   ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface SecondaryButtonProps {
   title: string;
   onPress: () => void;
   disabled?: boolean;
   loading?: boolean;
   style?: ViewStyle;
   testID?: string;
   icon?: React.ComponentProps<typeof Ionicons>['name'];
}

/** Outlined accent button — matches Subscribe plan action styling */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
   title,
   onPress,
   disabled = false,
   loading = false,
   style,
   testID,
   icon,
}) => {
   const isInactive = disabled || loading;
   const iconColor = disabled ? colors.text.muted : colors.accent.primary;

   return (
      <TouchableOpacity
         style={[styles.button, disabled && styles.buttonDisabled, style]}
         onPress={onPress}
         disabled={isInactive}
         activeOpacity={0.7}
         testID={testID}
      >
         {loading ? (
            <ActivityIndicator color={colors.accent.primary} />
         ) : (
            <View style={styles.content}>
               {icon ? (
                  <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
               ) : null}
               <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
            </View>
         )}
      </TouchableOpacity>
   );
};

const styles = StyleSheet.create({
   button: {
      backgroundColor: colors.background.screen,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
   },
   buttonDisabled: {
      backgroundColor: colors.background.input,
      borderColor: colors.border.light,
      opacity: 1,
   },
   content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
   },
   icon: {
      marginRight: spacing.sm,
   },
   text: {
      color: colors.accent.primary,
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   textDisabled: {
      color: colors.text.muted,
   },
});
