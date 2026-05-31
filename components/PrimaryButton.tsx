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

interface PrimaryButtonProps {
   title: string;
   onPress: () => void;
   disabled?: boolean;
   loading?: boolean;
   style?: ViewStyle;
   testID?: string;
   icon?: React.ComponentProps<typeof Ionicons>['name'];
   /** filled = solid accent (default); outline = transparent with accent border */
   variant?: 'filled' | 'outline';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
   title,
   onPress,
   disabled = false,
   loading = false,
   style,
   testID,
   icon,
   variant = 'filled',
}) => (
   <TouchableOpacity
      style={[
         styles.button,
         variant === 'outline' && styles.buttonOutline,
         (disabled || loading) && styles.disabled,
         style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
   >
      {loading ? (
         <ActivityIndicator
            color={variant === 'outline' ? colors.accent.primary : '#FFFFFF'}
         />
      ) : (
         <View style={styles.content}>
            {icon ? (
               <Ionicons
                  name={icon}
                  size={20}
                  color={variant === 'outline' ? colors.accent.primary : '#FFFFFF'}
                  style={styles.icon}
               />
            ) : null}
            <Text style={[styles.text, variant === 'outline' && styles.textOutline]}>{title}</Text>
         </View>
      )}
   </TouchableOpacity>
);

const styles = StyleSheet.create({
   button: {
      backgroundColor: colors.accent.primary,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
   },
   buttonOutline: {
      backgroundColor: colors.primary[50],
   },
   disabled: {
      opacity: 0.5,
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
      color: '#FFFFFF',
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      ...Platform.select({
         ios: { fontFamily: 'System', fontWeight: '600' },
         android: { fontFamily: 'sans-serif-medium' },
      }),
   },
   textOutline: {
      color: colors.accent.primary,
   },
});
