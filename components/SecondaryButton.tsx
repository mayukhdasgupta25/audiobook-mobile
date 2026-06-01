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
import { spacing, typography, borderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type SecondaryButtonVariant = 'filled' | 'outlined';

interface SecondaryButtonProps {
   title: string;
   onPress: () => void;
   disabled?: boolean;
   loading?: boolean;
   variant?: SecondaryButtonVariant;
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
   variant = 'filled',
   style,
   testID,
   icon,
}) => {
   const { colors } = useTheme();
   const isOutlined = variant === 'outlined';
   const styles = useThemedStyles((t) =>
      StyleSheet.create({
         button: {
            backgroundColor: isOutlined ? 'transparent' : t.colors.primary[50],
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            ...(isOutlined && {
               borderWidth: 2,
               borderColor: t.colors.accent.primary,
            }),
         },
         buttonDisabled: {
            backgroundColor: isOutlined ? 'transparent' : t.colors.background.input,
            borderColor: isOutlined ? t.colors.border.medium : undefined,
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
            color: isOutlined ? t.colors.text.dark : t.colors.accent.primary,
            fontSize: typography.fontSize.base,
            fontWeight: '600',
            ...Platform.select({
               ios: { fontFamily: 'System', fontWeight: '600' },
               android: { fontFamily: 'sans-serif-medium' },
            }),
         },
         textDisabled: {
            color: t.colors.text.muted,
         },
      })
   );

   const isInactive = disabled || loading;
   const activeColor = isOutlined ? colors.text.dark : colors.accent.primary;
   const iconColor = disabled ? colors.text.muted : activeColor;

   return (
      <TouchableOpacity
         style={[styles.button, disabled && styles.buttonDisabled, style]}
         onPress={onPress}
         disabled={isInactive}
         activeOpacity={0.7}
         testID={testID}
      >
         {loading ? (
            <ActivityIndicator color={activeColor} />
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
