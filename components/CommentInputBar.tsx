import React from 'react';
import {
   View,
   TextInput,
   StyleSheet,
   TouchableOpacity,
   Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { getTabBarFloatBottom, getTabBarFloatHorizontal } from '@/theme/tabLayout';

interface CommentInputBarProps {
   placeholder?: string;
   disabled?: boolean;
   onSend?: () => void;
   /** Pill-style bar floated above the bottom edge with shadow */
   floating?: boolean;
}

export const CommentInputBar: React.FC<CommentInputBarProps> = ({
   placeholder = 'Share your thoughts...',
   disabled = true,
   onSend,
   floating = false,
}) => {
   const insets = useSafeAreaInsets();

   const row = (
      <View style={styles.row}>
         <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={colors.text.muted} />
         </View>
         <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted}
            editable={!disabled}
            keyboardAppearance="light"
         />
         <TouchableOpacity
            style={[styles.sendButton, disabled && styles.sendDisabled]}
            disabled={disabled}
            onPress={onSend}
            activeOpacity={0.7}
         >
            <Ionicons name="send" size={18} color="#FFFFFF" />
         </TouchableOpacity>
      </View>
   );

   if (!floating) {
      return <View style={styles.container}>{row}</View>;
   }

   return (
      <View
         pointerEvents="box-none"
         style={[
            styles.floatingOuter,
            {
               paddingHorizontal: getTabBarFloatHorizontal(),
               paddingBottom: insets.bottom + getTabBarFloatBottom(),
            },
         ]}
      >
         <View style={styles.floatingPill}>{row}</View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      backgroundColor: colors.background.screen,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
   },
   floatingOuter: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      ...Platform.select({
         android: { elevation: 100 },
      }),
   },
   floatingPill: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.screen,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      ...shadows.lg,
      ...Platform.select({
         android: { elevation: 12 },
      }),
   },
   row: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background.input,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
   },
   input: {
      flex: 1,
      backgroundColor: colors.background.input,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      marginRight: spacing.sm,
   },
   sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
   },
   sendDisabled: {
      opacity: 0.4,
   },
});
