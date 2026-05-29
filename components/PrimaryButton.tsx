import React from 'react';
import {
   TouchableOpacity,
   Text,
   StyleSheet,
   ActivityIndicator,
   Platform,
   ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface PrimaryButtonProps {
   title: string;
   onPress: () => void;
   disabled?: boolean;
   loading?: boolean;
   style?: ViewStyle;
   testID?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
   title,
   onPress,
   disabled = false,
   loading = false,
   style,
   testID,
}) => (
   <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
   >
      {loading ? (
         <ActivityIndicator color="#FFFFFF" />
      ) : (
         <Text style={styles.text}>{title}</Text>
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
   disabled: {
      opacity: 0.5,
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
});
